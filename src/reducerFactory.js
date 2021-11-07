
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

    for (let [action, { isAsync }] of Object.entries(includeActions).filter(([action, { isAsync}]) => isAsync)) {
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
        };
      case actionTypes.getListIsLoading:
        return {
          ...newState,
          getListIsLoading: action.dispatch === false ? false : true,
        };
      case actionTypes.getIsLoading:
        return {
          ...newState,
          getIsLoading: action.dispatch === false ? false : true,
        };
      case actionTypes.set:
      case actionTypes.create:
        return {
          ...newState,
          list: { ...newState.list, [action.payload[byKey]]: action.payload },
          createIsLoading: false,
        };
      case actionTypes.createIsLoading:
        return {
          ...newState,
          createIsLoading: action.dispatch === false ? false : true,
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
        };
      case actionTypes.deleteIsLoading:
        return {
          ...newState,
          deleteIsLoading: action.dispatch === false ? false : true,
        };
      case actionTypes.update:
        return {
          ...newState,
          list: {
            ...newState.list,
            [action.payload[byKey]]: action.payload,
          },
          updateIsLoading: false,
        };
      case actionTypes.updateIsLoading:
        return {
          ...newState,
          updateIsLoading: action.dispatch === false ? false : true,
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
    selectedId,
  } = config;

  const subReducer = getSubReducer(camelCaseName, config, actionTypes)
  return (state, action) => {
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
        return {
          ...initialStateRoot,
          list: obj,
        };
    };
    return newState;
  };
};


export const mapToProps = (camelCaseName, config) => {
  const {
    id,
    byKey,
    parent,
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
  
  const mapStateToPropsBare = (state = {}) => ({
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
        { [`${camelCaseName}List`]: state.list }
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
      mapStateToPropsBare: (state) => mapStateToPropsBare(state[camelCaseName]),
      mapStateToProps: (state) => mapStateToProps(state[camelCaseName]),
    };
  }
  return {
        mapStateAndOwnPropsToPropsBare: (state, ownProps) => {
          if (typeof ownProps !== 'object') {
            throw 'When "parent" is defined, ownProps needs to be included too, i.e. mapToProps(state, ownProps).'
          }
          return ({
              // If the parent key is not specified in ownProps then it is assumed to be null
              ...ownProps[parent] || ownProps[parent] === null
                ? 
                  // Return child state by parent
                  mapStateToPropsBare(state[camelCaseName].list[ownProps[parent]])
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
                    [`${parent}List`]: Object.keys(state[camelCaseName].list),
                  }
                : {},
            }
          )},
        mapStateAndOwnPropsToProps: (state, ownProps) => {
          if (typeof ownProps !== 'object') {
            throw 'When "parent" is defined, ownProps needs to be included too, i.e. mapToProps(state, ownProps).'
          }
          return ({
              // If the parent key is not specified in ownProps then it is assumed to be null
              ...ownProps[parent] || ownProps[parent] === null
                ? 
                  // Return child state by parent
                  mapStateToProps(state[camelCaseName].list[ownProps[parent]])
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
                    [`${parent}List`]: Object.keys(state[camelCaseName].list),
                  }
                : {},
            }
          )},
  };
};
