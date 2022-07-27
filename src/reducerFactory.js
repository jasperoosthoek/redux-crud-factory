import { arrayToObject, titleCase } from './utils';

const getAsyncInitialState = action => ({
  [action]: {
    isLoading: false,
    error: null,
  },
})

const initialStateRoot = ({ state }) => ({
  list: null,
  actions: getAsyncInitialState('getAll'),
  state,
});

export const getInitialState = ({
  selectedId,
  selectedIds,
  actions,
  includeActions,
  state: includeState,
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

// Single functions handle all isLoading, error & clearError actions in state.
// This is DRY and can be easily extended
const setIsLoading = (state, { payload, asyncState }, actionName) => {
  const isLoading = payload === false ? false : true;
  return {
    ...state,
    actions: {
      ...state.actions,
      [actionName]: {
        isLoading,
        error: null,
        ...isLoading ? asyncState : {},
      },
    },
  }
};

const setError = (state, action, actionName) => ({
  ...state,
  actions: {
    ...state.actions,
    [actionName]: {
      ...state.actions[actionName],
      isLoading: false,
      error: action.payload || null,
    },
  },
});

const setClearError = (state, action, actionName) => ({
  ...state,
  actions: {
    ...state.actions,
    [actionName]: {
      isLoading: false,
      error: null,
    },
  },
});

const getSubReducer = (objectName, config, actionTypes) => {
  const {
    id,
    byKey,
    state: includeState,
    selectedId,
    selectedIds,
    actions,
    includeActions,
  } = config;
  
  return (state, action) => {
    const prevState = state || getInitialState(config);
    const prevActions = prevState.actions;
    const selectedIdsNew = selectedIds && prevState[selectedIds]

    let actionName;

    const findByActionSubType = subType => (
      (
        actionTypes[subType] && Object.entries(actionTypes[subType])
          .find(([, actionType]) => action.type === actionType)
      ) || []
    )[0]
    actionName = findByActionSubType('isLoading')
    // For example: actionName === 'getList' when getList() triggers isLoading action
    if (actionName) return setIsLoading(prevState, action, actionName);

    actionName = findByActionSubType('error')
    if (actionName) return setError(prevState, action, actionName);

    actionName = findByActionSubType('clearError')
    if (actionName) return setClearError(prevState, action, actionName);

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

    const payloadIsUndefined = key => {
      if (typeof action.payload === 'undefined') {
        console.error(`Error handling action ${action.type}: The value of action.payload should not be undefined.`)
        return true;
      } else if (key && typeof action.payload[byKey] === 'undefined') {
        console.error(`Error handling action ${action.type}: The value of action.payload.${key} should not be undefined.`)
        return true;
      }
      return false;
    }

    switch (action.type) {
      case actionTypes.actions.setList:
        if (payloadIsUndefined()) return prevState;
        
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
      case actionTypes.actions.set:
        if (payloadIsUndefined(byKey)) return prevState;

        return {
          ...prevState,
          list: { ...prevState.list || {}, [action.payload[byKey]]: action.payload },
          actions: {
            ...prevActions,
            // To do: "set" is ambiguous, replace by getSuccess & createSuccess etc.
            ...getAsyncInitialState('get'),
            ...getAsyncInitialState('create'),
          },
        };
      case actionTypes.actions.update:
        if (payloadIsUndefined(byKey) || payloadIsUndefined(id)) return prevState;

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
      case actionTypes.actions.clear:
        if (payloadIsUndefined(byKey)) return prevState;
        
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
      case actionTypes.actions.select:
        if (payloadIsUndefined()) return prevState;
        if (typeof action.payload === 'object' && payloadIsUndefined(byKey)) return prevState;

        return {
          ...prevState,
          ...actions.select === 'single'
            ? { [selectedId]: typeof action.payload === 'object' ? action.payload[byKey] : action.payload}
            : actions.select === 'multiple'
            ? { [selectedIds]: prevState[selectedIds].add(typeof action.payload === 'object' ? action.payload[byKey] : action.payload) }
            : {},
        };
      case actionTypes.actions.unSelect:
        if (payloadIsUndefined()) return prevState;
        if (typeof action.payload === 'object' && payloadIsUndefined(byKey)) return prevState;
        
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
      case actionTypes.actions.clearList:
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
      ...state ? state : initialStateRoot(config),
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
      case actionTypes.isLoading.getAll:
        return setIsLoading(prevState, action, 'getAll');
      case actionTypes.error.getAll:
        return setError(prevState, action, 'getAll');
      case actionTypes.error.getAll:
        return setClearError(prevState, action, 'getAll');
      case actionTypes.actions.clearAll:
        return initialStateRoot(config);
      case actionTypes.actions.setAll:
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


