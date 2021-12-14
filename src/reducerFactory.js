
import { snakeToCamelCase, toUpperCamelCase, arrayToObject } from './utils';
import {
  formatFunctionNames,
} from './actionsFactory';

const initialStateRoot = {
  list: {},
  getAllIsLoading: false,
};

const getAsyncInitialState = action => ({
  [`${action}IsLoading`]: false,
  [`${action}HasErrored`]: false,
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

    for (let [action, { isAsync }] of Object.entries(includeActions).filter(([action, { isAsync }]) => isAsync)) {
      let actionIsLoading = `${action}IsLoading`;
      let actionHasErrored = `${action}HasErrored`;
      switch (action.type) {
        case actionTypes[actionIsLoading]:
          let isLoading = action.dispatch === false ? false : true;
          return {
            ...newState,
            [actionIsLoading]: isLoading,
            ...isLoading ? { [actionHasErrored]: false } : {},
          };
        case actionTypes[actionHasErrored]:
          let hasErrored = action.dispatch ? action.dispatch : false;
          return {
            ...newState,
            [actionHasErrored]: hasErrored,
            ...hasErrored ? { [actionIsLoading]: false } : {},
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
          getListHasErrored: false,
        };
      case actionTypes.getListIsLoading:
        return {
          ...newState,
          getListIsLoading: action.dispatch === false ? false : true,
          getListHasErrored: false,
        };
      case actionTypes.getListHasErrored:
        return {
          ...newState,
          getListIsLoading: false,
          getListHasErrored: action.dispatch || false,
        };
      case actionTypes.getIsLoading:
        return {
          ...newState,
          getIsLoading: action.dispatch === false ? false : true,
          getHasErrored: false,
        };
      case actionTypes.getHasErrored:
        return {
          ...newState,
          getIsLoading: false,
          getHasErrored: action.dispatch || false,
        };
      case actionTypes.set:
        return {
          ...newState,
          list: { ...newState.list, [action.payload[byKey]]: action.payload },
          createIsLoading: false,
          createHasErrored: false,
        };
      case actionTypes.update:
        return {
          ...newState,
          list: { ...newState.list, [action.payload[byKey]]: { ...newState.list[action.payload[byKey]], ...action.payload } },
          updateIsLoading: false,
          updateHasErrored: false,
        };
      case actionTypes.createIsLoading:
        return {
          ...newState,
          createIsLoading: action.dispatch === false ? false : true,
          createHasErrored: false,
        };
      case actionTypes.createHasErrored:
        return {
          ...newState,
          createIsLoading: false,
          createHasErrored: action.dispatch || false,
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
          deleteHasErrored: false,
        };
      case actionTypes.deleteIsLoading:
        return {
          ...newState,
          deleteIsLoading: action.dispatch === false ? false : true,
          deleteHasErrored: false,
        };
      case actionTypes.deleteHasErrored:
        return {
          ...newState,
          deleteIsLoading: false,
          deleteHasErrored: action.dispatch || false,
        };
      case actionTypes.update:
        return {
          ...newState,
          list: {
            ...newState.list,
            [action.payload[byKey]]: action.payload,
          },
          updateIsLoading: false,
          updateHasErrored: false,
        };
      case actionTypes.updateIsLoading:
        return {
          ...newState,
          updateIsLoading: action.dispatch === false ? false : true,
          updateHasErrored: false,
        };
      case actionTypes.updateHasErrored:
        return {
          ...newState,
          updateIsLoading: false,
          updateHasErrored: action.dispatch || false,
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
          getAllIsLoading: action.dispatch === false ? false : true,
          getAllHasErrored: false,
        };
      case actionTypes.getAllHasErrored:
        return {
          ...newState,
          getAllIsLoading: false,
          getAllIsHasErrored: action.dispatch || false,
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
            [`${action}HasErrored`]: state[`${action}HasErrored`],
          }
        : {},
    }), {}),
  });
  
  const mapStateToPropsStripped = (state = {}) => ({
    ...actions.get
      ?
        { getIsLoading: state.getIsLoading }
      : {},
    ...actions.create
      ?
        { createIsLoading: state.createIsLoading }
      : {},
    ...actions.update
      ?
        { updateIsLoading: state.updateIsLoading }
      : {},
    ...actions.delete
      ?
        { deleteIsLoading: state.deleteIsLoading }
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
        { [`get${functionPlural}IsLoading`]: state.getIsLoading }
      : {},
    ...actions.create
      ?
        { [`create${functionSingle}IsLoading`]: state.createIsLoading }
      : {},
    ...actions.update
      ?
        { [`update${functionSingle}IsLoading`]: state.updateIsLoading }
      : {},
    ...actions.delete
      ?
        { [`delete${functionSingle}IsLoading`]: state.deleteIsLoading }
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
                    // [`${parent}List`]: Object.keys(state[camelCaseName].list),
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
                    // [`${parent}List`]: Object.keys(state[camelCaseName].list),
                  }
                : {},
            }
          )},
  };
};
