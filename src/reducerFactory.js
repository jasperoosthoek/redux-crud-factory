
import { arrayToObject } from './utils';
import { formatFunctionNames } from './actionsFactory';

const initialStateRoot = {
  list: {},
  getAllIsLoading: false,
  getAllError: null,
};

const getAsyncInitialState = action => ({
  [`${action}IsLoading`]: false,
  [`${action}Error`]: null,
})

const getInitialState = ({
  includeProps,
  select,
  selectedId,
  actions,
  includeActions,
}) => ({
  list: null,
  ...getAsyncInitialState('getList'),
  ...actions.get ? getAsyncInitialState('get') : {},
  ...actions.create ? getAsyncInitialState('create') : {},
  ...actions.delete ? getAsyncInitialState('delete') : {},
  ...actions.update ? getAsyncInitialState('update') : {},
  ...actions.select === 'single'
    ? { [selectedId]: null }
    : {},
  ...includeProps,
  ...Object.entries(includeActions).reduce((obj, [action, { isAsync, initialState = {} }]) => ({
    ...obj,
    ...isAsync ? getAsyncInitialState(action) : {},
    ...initialState,
  }), {})
});

const getSubReducer = (objectName, config, actionTypes) => {
  const {
    id,
    byKey,
    includeProps,
    select,
    selectedId,
    actions,
    includeActions,
  } = config;

  return (state, action) => {
    const newState = state || getInitialState(config);

    for (let [act, { isAsync }] of Object.entries(includeActions).filter(([dummy, { isAsync }]) => isAsync)) {
      let actionIsLoading = `${act}IsLoading`;
      let actionError = `${act}Error`;
      switch (action.type) {
        case actionTypes[actionIsLoading]:
          let isLoading = action.payload === false ? false : true;
          return {
            ...newState,
            [actionIsLoading]: isLoading,
            ...isLoading ? { [actionError]: null } : {},
          };
        case actionTypes[actionError]:
          let Error = action.payload ? action.payload : null;
          return {
            ...newState,
            [actionError]: Error,
            ...Error ? { [actionIsLoading]: false } : {},
          };
      }
    }
    switch (action.type) {
      case actionTypes.setList:
        return {
          ...newState,
          list: arrayToObject(action.payload, byKey),
          ...actions.select === 'single'
            ? { [selectedId]: null }
            : {},
          getListIsLoading: false,
          getListError: null,
        };
      case actionTypes.getListIsLoading:
        return {
          ...newState,
          getListIsLoading: action.payload === false ? false : true,
          getListError: null,
        };
      case actionTypes.getListError:
        return {
          ...newState,
          getListIsLoading: false,
          getListError: action.payload || null,
        };
      case actionTypes.getIsLoading:
        return {
          ...newState,
          getIsLoading: action.payload === false ? false : true,
          getError: null,
        };
      case actionTypes.getError:
        return {
          ...newState,
          getIsLoading: false,
          getError: action.payload || null,
        };
      case actionTypes.set:
        return {
          ...newState,
          list: { ...newState.list || {}, [action.payload[byKey]]: action.payload },
          // To do: "set" is ambiguous, replace by getSuccess & createSuccess etc.
          getIsLoading: false,
          getError: null,
          createIsLoading: false,
          createError: null,
        };
      case actionTypes.update:
        return {
          ...newState,
          list: {
            ...action.payload[id] === action.id && action.payload[byKey] === action.key
              ? newState.list
              // When id !== byKey it is possible to change the key. Therefore we need the id to be able to remove the
              // original object
              : Object.fromEntries(Object.entries(newState.list).filter(([key, obj]) => obj[id] !== action.id && obj[byKey] !== action.key)),
            [action.payload[byKey]]: { ...newState.list[action.payload[byKey]], ...action.payload },
          },
          updateIsLoading: false,
          updateError: null,
        };
        case actionTypes.updateIsLoading:
          return {
            ...newState,
            updateIsLoading: action.payload === false ? false : true,
            updateError: null,
          };
        case actionTypes.updateError:
          return {
            ...newState,
            updateIsLoading: false,
            updateError: action.payload || null,
          };
      case actionTypes.createIsLoading:
        return {
          ...newState,
          createIsLoading: action.payload === false ? false : true,
          createError: null,
        };
      case actionTypes.createError:
        return {
          ...newState,
          createIsLoading: false,
          createError: action.payload || null,
        };
      case actionTypes.delete:
        const newList = { ...(newState || {}).list };
        if (newList[action.payload[byKey]]) {
          delete newList[action.payload[byKey]];
        }
        return {
          ...newState,
          ...actions.select === 'single'
            ? {
                [selectedId]: newState[selectedId] === action.payload[byKey] ? null : newState[selectedId],
              }
            : {},
          list: newList,
          deleteIsLoading: false,
          deleteError: null,
        };
      case actionTypes.deleteIsLoading:
        return {
          ...newState,
          deleteIsLoading: action.payload === false ? false : true,
          deleteError: null,
        };
      case actionTypes.deleteError:
        return {
          ...newState,
          deleteIsLoading: false,
          deleteError: action.payload || null,
        };
      case actionTypes.select:
        return {
          ...newState,
          ...actions.select === 'single'
            ? { [selectedId]: action.payload[byKey] }
            : {},
        };
      case actionTypes.unSelect:
        return {
          ...newState,
          ...actions.select === 'single'
            ? { [selectedId]: null }
            : {},
        };
      case actionTypes.clearList:
        return getInitialState(config);
      default:
        // Return null to indicate this reducer did not update
        return null;
    }
  }
}

export default (objectName, config = {}, actionTypes) => {
  const {
    id,
    byKey,
    includeProps,
    parent,
    recursive,
    selectedId,
  } = config;

  const subReducer = getSubReducer(objectName, config, actionTypes)
  const reducer = (state, action) => {
    if (!parent) {
      let subState = subReducer(state, action);
      // subState can either be null or an object:
      // object: An action in actionTypes was triggered: set state to subState
      // null: No action in actionTypes was triggered: Return original state or if state has not been properly
      // initialized (is undefined) return initial state from getInitialState(config).
      return subState === null ? state || getInitialState(config) : subState;
    }
    const parentKey = action.parent ? action.parent : null;

    let subState = subReducer(
      ((state || getInitialState(config)).list || {})[parentKey],
      action
    );

    const newState = {
      ...state ? state : getInitialState(config),
      list: {
        ...state && state.list ? state.list : {},
        ...(action.parent || action.parent === null) && subState !== null
          // Only update [parentKey] when subState is not null because this might otherwise be triggered by another
          // reducer with the same parent key
          ? { [parentKey]: subState }
          : {},
      },
    }

    switch (action.type) {
      case actionTypes.getAllIsLoading:
        return {
          ...newState,
          getAllIsLoading: action.payload === false ? false : true,
          getAllError: null,
        };
      case actionTypes.getAllError:
        return {
          ...newState,
          getAllIsLoading: false,
          getAllError: action.payload || null,
        };
      case actionTypes.clearAll:
        return {
          ...initialStateRoot,
          list: { },
        }
      case actionTypes.setAll:
        const obj = {};
        action.payload.map((o) => {
          if (!obj[o[parent]]) {
            obj[o[parent]] = getInitialState(config);
          }
          obj[o[parent]].list[o[byKey]] = o;
        });
        if (recursive) {
          // Create empty state too for children of this object
          action.payload.map((o) => {
            if (!obj[o[id]]) {
              obj[o[id]] = getInitialState(config);
            }
          });
        }
        return {
          ...initialStateRoot,
          list: obj,
        };
      case actionTypes.create:
      case actionTypes.update:
        if (recursive && !newState[action.payload[id]]) {
          // A recursive object is created or updated, create empty state for the children of this object.
          // Note that the parent key does not necessarily needs to be the primery key that is considered unmutable.
          // It can also be another key and it is allowed to change. Therefore, handle the update case as well
          // and also check if action.payload[id] already exists.
          return {
            ...newState,
            list: {
              ...newState.list,
              [action.payload[id]]: getInitialState(config),
            }
          }
        }
      break
    };
    return newState;
  };

  return reducer;
};


