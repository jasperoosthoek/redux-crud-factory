
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
    const prevState = state || getInitialState(config);

    for (let [act, { isAsync }] of Object.entries(includeActions).filter(([dummy, { isAsync }]) => isAsync)) {
      let actionIsLoading = `${act}IsLoading`;
      let actionError = `${act}Error`;
      switch (action.type) {
        case actionTypes[actionIsLoading]:
          let isLoading = action.payload === false ? false : true;
          return {
            ...prevState,
            [actionIsLoading]: isLoading,
            ...isLoading ? { [actionError]: null } : {},
          };
        case actionTypes[actionError]:
          let Error = action.payload ? action.payload : null;
          return {
            ...prevState,
            [actionError]: Error,
            ...Error ? { [actionIsLoading]: false } : {},
          };
      }
    }
    switch (action.type) {
      case actionTypes.setList:
        let list = arrayToObject(action.payload, byKey);
        return {
          ...prevState,
          list,
          // Reset selected value when it is selected in the previous state but it no longer exists in the
          // new state. Do not touch selected value when it still exists in the new state.
          ...actions.select === 'single' && prevState[selectedId] && !list[prevState[selectedId]]
            ? { [selectedId]: null }
            : {},
          getListIsLoading: false,
          getListError: null,
        };
      case actionTypes.getListIsLoading:
        return {
          ...prevState,
          getListIsLoading: action.payload === false ? false : true,
          getListError: null,
        };
      case actionTypes.getListError:
        return {
          ...prevState,
          getListIsLoading: false,
          getListError: action.payload || null,
        };
      case actionTypes.getIsLoading:
        return {
          ...prevState,
          getIsLoading: action.payload === false ? false : true,
          getError: null,
        };
      case actionTypes.getError:
        return {
          ...prevState,
          getIsLoading: false,
          getError: action.payload || null,
        };
      case actionTypes.set:
        return {
          ...prevState,
          list: { ...prevState.list || {}, [action.payload[byKey]]: action.payload },
          // To do: "set" is ambiguous, replace by getSuccess & createSuccess etc.
          getIsLoading: false,
          getError: null,
          createIsLoading: false,
          createError: null,
        };
      case actionTypes.update:
        return {
          ...prevState,
          list: {
            ...action.payload[id] === action.id && action.payload[byKey] === action.key
              ? prevState.list
              // When id !== byKey it is possible to change the key. Therefore we need the id to be able to remove the
              // original object
              : Object.fromEntries(Object.entries(prevState.list).filter(([key, obj]) => obj[id] !== action.id && obj[byKey] !== action.key)),
            [action.payload[byKey]]: { ...prevState.list[action.payload[byKey]], ...action.payload },
          },
          updateIsLoading: false,
          updateError: null,
        };
        case actionTypes.updateIsLoading:
          return {
            ...prevState,
            updateIsLoading: action.payload === false ? false : true,
            updateError: null,
          };
        case actionTypes.updateError:
          return {
            ...prevState,
            updateIsLoading: false,
            updateError: action.payload || null,
          };
      case actionTypes.createIsLoading:
        return {
          ...prevState,
          createIsLoading: action.payload === false ? false : true,
          createError: null,
        };
      case actionTypes.createError:
        return {
          ...prevState,
          createIsLoading: false,
          createError: action.payload || null,
        };
      case actionTypes.delete:
        const newList = { ...(prevState || {}).list };
        if (newList[action.payload[byKey]]) {
          delete newList[action.payload[byKey]];
        }
        return {
          ...prevState,
          ...actions.select === 'single'
            ? {
                [selectedId]: prevState[selectedId] === action.payload[byKey] ? null : prevState[selectedId],
              }
            : {},
          list: newList,
          deleteIsLoading: false,
          deleteError: null,
        };
      case actionTypes.deleteIsLoading:
        return {
          ...prevState,
          deleteIsLoading: action.payload === false ? false : true,
          deleteError: null,
        };
      case actionTypes.deleteError:
        return {
          ...prevState,
          deleteIsLoading: false,
          deleteError: action.payload || null,
        };
      case actionTypes.select:
        return {
          ...prevState,
          ...actions.select === 'single'
            ? { [selectedId]: action.payload[byKey] }
            : {},
        };
      case actionTypes.unSelect:
        return {
          ...prevState,
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

    const prevState = {
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
          ...prevState,
          getAllIsLoading: action.payload === false ? false : true,
          getAllError: null,
        };
      case actionTypes.getAllError:
        return {
          ...prevState,
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
        if (recursive && !prevState[action.payload[id]]) {
          // A recursive object is created or updated, create empty state for the children of this object.
          // Note that the parent key does not necessarily needs to be the primery key that is considered unmutable.
          // It can also be another key and it is allowed to change. Therefore, handle the update case as well
          // and also check if action.payload[id] already exists.
          return {
            ...prevState,
            list: {
              ...prevState.list,
              [action.payload[id]]: getInitialState(config),
            }
          }
        }
      break
    };
    return prevState;
  };

  return reducer;
};


