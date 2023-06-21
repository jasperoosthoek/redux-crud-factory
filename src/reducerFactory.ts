import { arrayToObject, titleCase } from './utils';
import { IncludeActions, ValidatedConfig, ValidatedParentConfig } from './index';

type AsyncState = {
  isLoading: boolean;
  error: any;
}
const asyncInitialState = {
  isLoading: false,
  error: null,
} as AsyncState;

const getAsyncInitialState = <T extends string>(action: T): { [action: string]: AsyncState} => ({
  [action]: asyncInitialState,
})

const includeActionsInitialState = (includeActions: IncludeActions) => (
  Object.entries(includeActions).reduce((obj, [action, { isAsync, initialState = {} }]) => ({
    ...obj,
    ...isAsync ? getAsyncInitialState(action) : {},
    ...initialState,
  }), {})
);

const initialStateRoot = ({ state, includeActions }: ValidatedConfig | ValidatedParentConfig) => ({
  list: null as any,
  actions: {
    ...getAsyncInitialState('getAll'),
    ...includeActions ? includeActionsInitialState(includeActions) : {},
  },
  state,
});

export const getInitialState = ({
  selectedId,
  selectedIds,
  actions,
  includeActions,
  state: includeState,
}: ValidatedConfig | ValidatedParentConfig) => ({
  list: null as any,
  actions: {
    ...getAsyncInitialState('getList'),
    ...actions.get ? getAsyncInitialState('get') : {},
    ...actions.create ? getAsyncInitialState('create') : {},
    ...actions.delete ? getAsyncInitialState('delete') : {},
    ...actions.update ? getAsyncInitialState('update') : {},
    ...includeActions ? includeActionsInitialState(includeActions) : {},
  },
  ...actions.select === 'single'
    ? { [selectedId as string]: null }
    : actions.select === 'multiple'
    ? { [selectedIds as string]: new Set() }
    : {},
  state: includeState,
});

// Single functions handle all isLoading, error & clearError actions in state.
// This is DRY and can be easily extended
const setIsLoading = (state: any, { payload, asyncState }: { payload: any; asyncState: AsyncState}, actionName: string) => {
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

const setError = (state: any, action: any, actionName: string) => ({
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

const setClearError = (state: any, action: any, actionName: string) => ({
  ...state,
  actions: {
    ...state.actions,
    [actionName]: {
      isLoading: false,
      error: null,
    },
  },
});

const getSubReducer = (
  objectName: string,
  config: ValidatedConfig | ValidatedParentConfig,
  actionTypes: any
) => {
  const {
    id,
    byKey,
    state: includeState,
    selectedId,
    selectedIds,
    actions,
    includeActions,
  } = config;
  
  return (state: any, action: any) => {
    const prevState = state || getInitialState(config);
    const prevActions = prevState.actions;
    const selectedIdsNew = selectedIds && prevState[selectedIds as string]

    let actionName;

    const findByActionSubType = (subType: string) => (
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

    const payloadIsUndefined = (key?: string | null | undefined) => {
      if (typeof action.payload === 'undefined') {
        console.error(`Error handling action ${action.type}: The value of action.payload should not be undefined.`)
        return true;
      } else if (key && typeof action.payload[byKey as string] === 'undefined') {
        console.error(`Error handling action ${action.type}: The value of action.payload.${key} should not be undefined.`)
        return true;
      }
      return false;
    }

    switch (action.type) {
      case actionTypes.actions.setList:
        if (payloadIsUndefined()) return prevState;
        
        // @ts-ignore
        let list = arrayToObject(action.payload as any, byKey);
        if (actions.select === 'multiple' && selectedIdsNew.length !== 0) {
          selectedIdsNew.forEach((id: string | number) => {
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
          ...actions.select === 'single' && prevState[selectedId as string] && !list[prevState[selectedId as string]]
            // Reset selected value when it is selected in the previous state but it no longer exists in the
            // new state. Do not touch selected value when it still exists in the new state.
            ? { [selectedId as string]: null }
            : actions.select === 'multiple'
            // Do something similar for multiple selections: Remove selected ids that no longer exist in the new list
            ? { [selectedIds as string]: selectedIdsNew }
            : {},
        };
      case actionTypes.actions.set:
        if (payloadIsUndefined(byKey)) return prevState;

        return {
          ...prevState,
          list: { ...prevState.list || {}, [action.payload[byKey as string]]: action.payload },
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
            ...action.payload[id] === action.id && action.payload[byKey as string] === action.key
              ? prevState.list
              // When id !== byKey it is possible to change the key. Therefore we need the id to be able to remove the
              // original object
              : Object.fromEntries(Object.entries(prevState.list).filter(
                ([key, obj]: [string, any]) => obj[id] !== action.id && obj[byKey as string] !== action.key)
              ),
            [action.payload[byKey as string]]: { ...prevState.list[action.payload[byKey as string]], ...action.payload },
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
          selectedIdsNew.delete(action.payload[byKey as string]);
        }
        if (newList[action.payload[byKey as string]]) {
          delete newList[action.payload[byKey as string]];
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
                [selectedId as string]: prevState[selectedId as string] === action.payload[byKey as string] ? null : prevState[selectedId as string],
              }
            : actions.select === 'multiple'
            ? {
                [selectedIds as string]: selectedIdsNew,
              }
            : {},
        };
      case actionTypes.actions.select:
        if (payloadIsUndefined()) return prevState;
        if (typeof action.payload === 'object' && payloadIsUndefined(byKey)) return prevState;

        return {
          ...prevState,
          ...actions.select === 'single'
            ? { [selectedId as string]: typeof action.payload === 'object' ? action.payload[byKey as string] : action.payload}
            : actions.select === 'multiple'
            ? { [selectedIds as string]: prevState[selectedIds as string].add(typeof action.payload === 'object' ? action.payload[byKey as string] : action.payload) }
            : {},
        };
      case actionTypes.actions.unSelect:
        // if (payloadIsUndefined()) return prevState;
        if (typeof action.payload === 'object' && payloadIsUndefined(byKey)) return prevState;
        
        if (actions.select === 'multiple') {
          selectedIdsNew.delete(typeof action.payload === 'object' ? action.payload[byKey as string] : action.payload)
        }
        return {
          ...prevState,
          ...actions.select === 'single'
            ? { [selectedId as string]: null }
            : actions.select === 'multiple'
            ? { [selectedIds as string]: selectedIdsNew }
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

export default (objectName: string, config: (ValidatedConfig | ValidatedParentConfig), { actionTypes }: any) => {
  const {
    id,
    byKey,
    parent,
    // @ts-ignore
    recursive,
    selectedId,
  } = config || {} as ValidatedConfig | ValidatedParentConfig;

  const subReducer = getSubReducer(objectName, config, actionTypes)
  const reducer = (state: any, action: any) => {
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
        const obj = {} as any;
        action.payload.map((o: any) => {
          if (!obj[o[parent]]) {
            obj[o[parent]] = getInitialState(config);
            obj[o[parent]].list = { [o[byKey as string]]: o };
          } else {
            obj[o[parent]].list[o[byKey as string]] = o;
          }
        });
        if (recursive) {
          // Create empty state too for children of this object
          action.payload.map((o: any) => {
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


