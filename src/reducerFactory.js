
import { snakeToCamelCase, toUpperCamelCase, arrayToObject } from './utils';
import {
  formatFunctionNames,
} from './actionsFactory';

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
  ...actions.getList
    ?
      { list: {}, ...getAsyncInitialState('getList') }
    : {},
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

const getSubReducer = (camelCaseName, config, actionTypes) => {
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
          list: { ...newState.list, [action.payload[byKey]]: action.payload },
          createIsLoading: false,
          createError: null,
        };
      case actionTypes.update:
        return {
          ...newState,
          list: { ...newState.list, [action.payload[byKey]]: { ...newState.list[action.payload[byKey]], ...action.payload } },
          updateIsLoading: false,
          updateError: null,
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
        const newList = { ...newState.list };
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
      case actionTypes.update:
        return {
          ...newState,
          list: {
            ...newState.list,
            [action.payload[byKey]]: action.payload,
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
        return newState;
    }
  }
}

export default (camelCaseName, config = {}, actionTypes) => {
  const {
    id,
    byKey,
    includeProps,
    parent,
    recursive,
    selectedId,
  } = config;

  const subReducer = getSubReducer(camelCaseName, config, actionTypes)
  const reducer = (state, action) => {
    if (!parent) {
      // This is the default reducer
      return subReducer(state, action);
    }
    const parentKey = action.parent ? action.parent : null;

    const newState = {
      ...state ? state : {},
      list: {
        ...state && state.list ? state.list : {},
        ...action.parent || action.parent === null
          ? { [parentKey]: subReducer((state || { list: {} }).list[parentKey], action) }
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
  return {
    reducer,
    reducerAsObject: { [camelCaseName]: reducer },
  }
};


export const mapToProps = (camelCaseName, config) => {
  const {
    id,
    byKey,
    parent,
    parentId,
    includeProps,
    select,
    selectedId,
    actions,
    includeActions,
  } = config;
  const { functionSingle, functionPlural } = formatFunctionNames(camelCaseName);
  const camelCaseId = toUpperCamelCase(byKey);
  
  const propsIncluded = (state) => ({
    ...includeProps
      ?
        Object.keys(includeProps).reduce((obj, propName) => ({
            ...obj,
            [propName]: state[propName],
        }), {})
      : {},
    ...Object.entries(includeActions).reduce((obj, [action, { isAsync, initialState = {} }]) => ({
      ...obj,
      ...isAsync
        ?
          {
            [`${action}IsLoading`]: state[`${action}IsLoading`],
            [`${action}Error`]: state[`${action}Error`],
          }
        : {},
    }), {}),
  });
  
  const mapStateToPropsStripped = (state = {}) => ({
    ...actions.get
      ?
        {
          getIsLoading: state.getIsLoading,
          getError: state.getError,
        }
      : {},
    ...actions.create
      ?
        {
          createIsLoading: state.createIsLoading,
          createError: state.createError,
        }
      : {},
    ...actions.update
      ?
        {
          updateIsLoading: state.updateIsLoading,
          updateError: state.updateError,
        }
      : {},
    ...actions.delete
      ?
        {
          deleteIsLoading: state.deleteIsLoading,
          deleteError: state.deleteError,
        }
      : {},
    ...actions.getList
      ?
        { list: state.list }
      : {},
    ...actions.select === 'single'
      ?
        {
          [`selected${camelCaseId}`]: state[selectedId],
          selected: state[selectedId] ? state.list[state[selectedId]] : null,
        }
      : {},
    ...propsIncluded(state),
  });
  const mapStateToProps = (state = {}) => ({
    ...actions.get
      ?
        {
          [`get${functionPlural}IsLoading`]: state.getIsLoading,
          [`get${functionPlural}Error`]: state.getError,
        }
      : {},
    ...actions.create
      ?
        {
          [`create${functionSingle}IsLoading`]: state.createIsLoading,
          [`create${functionSingle}Error`]: state.createError,
        }
      : {},
    ...actions.update
      ?
        {
          [`update${functionSingle}IsLoading`]: state.updateIsLoading,
          [`update${functionSingle}Error`]: state.updateError,
        }
      : {},
    ...actions.delete
      ?
        {
          [`delete${functionSingle}IsLoading`]: state.deleteIsLoading,
          [`delete${functionSingle}Error`]: state.deleteError,
        }
      : {},
    ...actions.getList
      ?
        // Default to empty object in case objects with parents get a parent prop that does not exist (yet) which is allowed.
        { [`${camelCaseName}List`]: state.list || {}}
      : {},
    ...actions.select === 'single'
      ?
        {
          [`selected${functionSingle}${camelCaseId}`]: state[selectedId],
          [`selected${functionSingle}`]: state[selectedId] ? state.list[state[selectedId]] : null,
        }
      : {},
    ...propsIncluded(state),
  });

  if (!parent) {
    // This is the default mapper
    return {
      mapStateToPropsStripped: (state) => mapStateToPropsStripped(state[camelCaseName]),
      mapStateToProps: (state) => mapStateToProps(state[camelCaseName]),
    };
  }
  return {
        mapStateAndOwnPropsToPropsStripped: (state, ownProps) => {
          if (typeof ownProps !== 'object') {
            throw 'When "parent" is defined, ownProps needs to be included too, i.e. mapToProps(state, ownProps).'
          }
          const parentFromProp = ownProps[parent];
          // When the parent is an object, retrieve the parentKey by using parentId from the object
          const parentKey = typeof(parentFromProp) === 'object' && parentFromProp !== null ? parentFromProp[parentId] : parentFromProp
          return ({
              // If the parent key is not specified in ownProps then it is assumed to be null
              ...ownProps[parent] || ownProps[parent] === null
                ? 
                  // Return child state by parent
                  mapStateToPropsStripped(state[camelCaseName].list[parentKey])
                :
                  {
                    // Return embedded list by [parent][key]
                    [`list`]: 
                      Object.fromEntries(
                        Object.entries(state[camelCaseName].list).map(
                          ([parentKey, { list }]) => [parentKey, list]
                        )
                      ),
                  },
              ...parent && actions.getList
                ?
                  {
                    getAllIsLoading: state[camelCaseName].getAllIsLoading,
                    getAllError: state[camelCaseName].getAllError,
                  }
                : {},
            }
          )},
        mapStateAndOwnPropsToProps: (state, ownProps) => {
          if (typeof ownProps !== 'object') {
            throw 'When "parent" is defined, ownProps needs to be included too, i.e. mapToProps(state, ownProps).'
          }
          const parentFromProp = ownProps[parent];
          // When the parent is an object, retrieve the parentKey by using parentId from the object
          const parentKey = parentFromProp !== null && typeof parentFromProp === 'object' ? parentFromProp[parentId] : parentFromProp
          return ({
              // If the parent key is not specified in ownProps then it is assumed to be null
              ...ownProps[parent] || ownProps[parent] === null
                ? 
                  // Return child state by parent
                  mapStateToProps(state[camelCaseName].list[parentKey])
                :
                  {
                    // Return embedded list by [parent][key]
                    [`${camelCaseName}List`]: 
                      Object.fromEntries(
                        Object.entries(state[camelCaseName].list).map(
                          ([parentKey, { list }]) => [parentKey, list]
                        )
                      ),
                  },
              ...parent && actions.getList
                ?
                  {
                    [`getAll${functionPlural}IsLoading`]: state[camelCaseName].getAllIsLoading,
                    [`getAll${functionPlural}Error`]: state[camelCaseName].getAllError,
                  }
                : {},
            }
          )},
  };
};
