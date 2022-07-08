import { arrayToObject, titleCase } from './utils';

const getAsyncInitialState = action => ({
  [action]: {
    isLoading: false,
    error: null,
  },
})

const initialStateRoot = ({ includeState }) => ({
  list: null,
  actions: getAsyncInitialState('getAll'),
  state: includeState,
});

const getInitialState = ({
  selectedId,
  selectedIds,
  actions,
  includeActions,
  includeState,
}) => ({
  list: null,
  actions: {
    ...getAsyncInitialState('getList'),
    ...actions.get ? getAsyncInitialState('get') : {},
    ...actions.create ? getAsyncInitialState('create') : {},
    ...actions.delete ? getAsyncInitialState('delete') : {},
    ...actions.update ? getAsyncInitialState('update') : {},
    ...Object.entries(includeActions).reduce((obj, [action, { isAsync, initialState = {} }]) => ({
      ...obj,
      ...isAsync ? getAsyncInitialState(action) : {},
      ...initialState,
    }), {}),
  },
  ...actions.select === 'single'
    ? { [selectedId]: null }
    : actions.select === 'multiple'
    ? { [selectedIds]: new Set() }
    : {},
  state: includeState,
});

const getSubReducer = (objectName, config, actionTypes) => {
  const {
    id,
    byKey,
    includeState,
    selectedId,
    selectedIds,
    actions,
    includeActions,
  } = config;

  const setIsLoading = action => ({
    isLoading: action.payload === false ? false : true,
    error: null,
  });
  const setError = action => ({
    isLoading: false,
    error: action.payload || null,
  });
  
  return (state, action) => {
    const prevState = state || getInitialState(config);
    const prevActions = prevState.actions;
    const selectedIdsNew = selectedIds && prevState[selectedIds]

    for (let [act, { isAsync }] of Object.entries(includeActions).filter(([dummy, { isAsync }]) => isAsync)) {
      let actionIsLoading = `${act}IsLoading`;
      let actionError = `${act}Error`;
      switch (action.type) {
        case actionTypes.includeActions[actionIsLoading]:
          return {
            ...prevState,
            actions: {
              ...prevActions,
              [act]: {
                ...prevActions[act],
                ...setIsLoading(action),
              },
            },
          };
        case actionTypes.includeActions[actionError]:
          let error = action.payload ? action.payload : null;
          return {
            ...prevState,
            actions: {
              ...prevActions,
              [act]: {
                ...prevActions[act],
                ...setError(action),
              },
            },
          };
      }
    }
    for (let [propName, initialValue] of Object.entries(includeState)) {
      const propNameTitleCase = titleCase(propName);
      switch (action.type) {
        case actionTypes.includeState[`set${propNameTitleCase}`]:
          return {
            ...prevState,
            state: {
              ...prevState.state,
              [propName]: action.payload,
            },
          };
        case actionTypes.includeState[`clear${propNameTitleCase}`]:
          return {
            ...prevState,
            state: {
              ...prevState.state,
              [propName]: initialValue,
            },
          };
      }
    }

    switch (action.type) {
      case actionTypes.setList:
        // To do: test for action.payload is undefined
        let list = arrayToObject(action.payload, byKey);
        if (actions.select === 'multiple' && selectedIdsNew.length !== 0) {
          selectedIdsNew.forEach(id => {
            if (!list[id]) selectedIdsNew.delete(id);
          });
        }

        return {
          ...prevState,
          list,
          actions: {
            ...prevActions,
            ...getAsyncInitialState('getList'),
          },
          ...actions.select === 'single' && prevState[selectedId] && !list[prevState[selectedId]]
            // Reset selected value when it is selected in the previous state but it no longer exists in the
            // new state. Do not touch selected value when it still exists in the new state.
            ? { [selectedId]: null }
            : actions.select === 'multiple'
            // Do something similar for multiple selections: Remove selected ids that no longer exist in the new list
            ? { [selectedIds]: selectedIdsNew }
            : {},
        };
      case actionTypes.getListIsLoading:
        return {
          ...prevState,
          actions: {
            ...prevActions,
            getList: setIsLoading(action),
          },
        };
      case actionTypes.getListError:
        return {
          ...prevState,
          actions: {
            ...prevActions,
            getList: setError(action),
          },
        };
      case actionTypes.getIsLoading:
        return {
          ...prevState,
          actions: {
            ...prevActions,
            get: setIsLoading(action),
          },
        };
      case actionTypes.getError:
        return {
          ...prevState,
          actions: {
            ...prevActions,
            get: setError(action),
          },
        };
      case actionTypes.set:
        return {
          ...prevState,
          list: { ...prevState.list || {}, [action.payload[byKey]]: action.payload },
          actions: {
            ...prevActions,
            // To do: "set" is ambiguous, replace by getSuccess & createSuccess etc.
            ...getAsyncInitialState('get'),
            ...getAsyncInitialState('clear'),
          },
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
          actions: {
            ...prevActions,
            ...getAsyncInitialState('update'),
          },
        };
        case actionTypes.updateIsLoading:
          return {
            ...prevState,
            actions: {
              ...prevActions,
              update: setIsLoading(action),
            },
          };
        case actionTypes.updateError:
          return {
            ...prevState,
            actions: {
              ...prevActions,
              update: setError(action),
            },
          };
      case actionTypes.createIsLoading:
        return {
          ...prevState,
          actions: {
            ...prevActions,
            create: setIsLoading(action),
          },
        };
      case actionTypes.createError:
        return {
          ...prevState,
          actions: {
            ...prevActions,
            create: setError(action),
          },
        };
      case actionTypes.clear:
        const newList = { ...(prevState || {}).list };
        if (actions.select === 'multiple') {
          selectedIdsNew.delete(action.payload[byKey]);
        }
        if (newList[action.payload[byKey]]) {
          delete newList[action.payload[byKey]];
        }
        return {
          ...prevState,
          list: newList,
          actions: {
            ...prevActions,
            ...getAsyncInitialState('delete'),
          },
          ...actions.select === 'single'
            ? {
                [selectedId]: prevState[selectedId] === action.payload[byKey] ? null : prevState[selectedId],
              }
            : actions.select === 'multiple'
            ? {
                [selectedIds]: selectedIdsNew,
              }
            : {},
        };
      case actionTypes.deleteIsLoading:
        return {
          ...prevState,
          actions: {
            ...prevActions,
            delete: setIsLoading(action),
          },
        };
      case actionTypes.deleteError:
        return {
          ...prevState,
          actions: {
            ...prevActions,
            delete: setError(action),
          },
        };
      case actionTypes.select:
        return {
          ...prevState,
          ...actions.select === 'single'
            ? { [selectedId]: typeof action.payload === 'object' ? action.payload[byKey] : action.payload}
            : actions.select === 'multiple'
            ? { [selectedIds]: prevState[selectedIds].add(typeof action.payload === 'object' ? action.payload[byKey] : action.payload) }
            : {},
        };
      case actionTypes.unSelect:
        if (actions.select === 'multiple') {
          selectedIdsNew.delete(typeof action.payload === 'object' ? action.payload[byKey] : action.payload)
        }
        return {
          ...prevState,
          ...actions.select === 'single'
            ? { [selectedId]: null }
            : actions.select === 'multiple'
            ? { [selectedIds]: selectedIdsNew }
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

export default (objectName, config = {}, { actionTypes }) => {
  const {
    id,
    byKey,
    parent,
    recursive,
    selectedId,
  } = config;
  console.log({ config, actionTypes })

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
      list: (action.parent || action.parent === null) && subState !== null
          // Only update [parentKey] when subState is not null because this might otherwise be triggered by another
          // reducer with the same parent key
          ? {
              ...(state || {}).list || {},
              [parentKey]: subState,
            }
          : state ? state.list : null
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
        return initialStateRoot(config);
      case actionTypes.setAll:
        const obj = {};
        action.payload.map((o) => {
          if (!obj[o[parent]]) {
            obj[o[parent]] = getInitialState(config);
            obj[o[parent]].list = { [o[byKey]]: o };
          } else {
            obj[o[parent]].list[o[byKey]] = o;
          }
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
          ...initialStateRoot(config),
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
              ...prevState.list || {},
              [action.payload[id]]: getInitialState(config),
            }
          }
        }
      break
    };
    return prevState;
  };

  return { reducers: reducer };
};


