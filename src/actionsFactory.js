
import { callIfFunc, camelToSnakeCase, snakeToCamelCase, toUpperCamelCase, pluralToSingle } from './utils';

const IS_LOADING = 'IS_LOADING';
const ERROR = 'ERROR';
const CLEAR_ERROR = 'CLEAR_ERROR';
const GET = 'GET';
const GET_IS_LOADING = 'GET_IS_LOADING';
const GET_ERROR = 'GET_ERROR';
const LIST = 'LIST';
const SET = 'SET';
const GET_LIST = 'GET_LIST';
const SET_LIST = 'SET_LIST';
const GET_ALL = 'GET_ALL';
const CLEAR_ALL = 'CLEAR_ALL';
const SET_ALL = 'SET_ALL';
const CREATE = 'CREATE';
const CREATE_IS_LOADING = 'CREATE_IS_LOADING';
const CREATE_ERROR = 'CREATE_ERROR';
const UPDATE = 'UPDATE';
const UPDATE_IS_LOADING = 'UPDATE_IS_LOADING';
const UPDATE_ERROR = 'UPDATE_ERROR';
const DELETE = 'DELETE';
const DELETE_IS_LOADING = 'DELETE_IS_LOADING';
const DELETE_ERROR = 'DELETE_ERROR';
const SELECT = 'SELECT';
const SELECT_ALL = 'SELECT_ALL';
const UN_SELECT = 'UN_SELECT';
const UN_SELECT_ALL = 'UN_SELECT_ALL';
const CLEAR = 'CLEAR';
const CLEAR_LIST = 'CLEAR_LIST';
const GET_ALL_IS_LOADING = 'GET_ALL_IS_LOADING';
const GET_ALL_ERROR = 'GET_ALL_ERROR';

const getActionTypes = (actionPrefix, actionName, actionSuffix) => ({
  [`${snakeToCamelCase(actionPrefix)}${actionSuffix ? toUpperCamelCase(actionSuffix) : ''}`]:
    `${actionPrefix}${actionName ? `_${actionName}` : ''}${actionSuffix ? `_${actionSuffix}` : ''}`,
})

const getAsyncActionTypes = (actionPrefix, actionName, actionSuffix) => {
  const func = `${snakeToCamelCase(actionPrefix)}${actionSuffix ? toUpperCamelCase(actionSuffix) : ''}`;
  const action = `${actionPrefix}${actionName ? `_${actionName}` : ''}${actionSuffix ? `_${actionSuffix}` : ''}`;
  return {
    [func]: action,
    [`${func}IsLoading`]: `${action}_${IS_LOADING}`,
    [`${func}Error`]: `${action}_${ERROR}`,
    [`${func}ClearError`]: `${action}_${CLEAR_ERROR}`,
  };
}
const formatActionNames = camelCaseName => {
  const actionPlural = camelToSnakeCase(camelCaseName).toUpperCase();
  return {
    actionPlural,
    actionSingle: pluralToSingle(actionPlural),
  };
}

const formatActionTypes = (camelCaseName, config) => {
  const {
    actionTypeStyle,
    select,
    parent,
    actions,
    includeActions,
  } = config;
  const { actionSingle, actionPlural } = formatActionNames(camelCaseName);
  if (typeof actionTypeStyle == 'function') {
    return {
      ...actions.get
        ?
          {
            get: actionTypeStyle(GET),
            getIsLoading: actionTypeStyle(GET_IS_LOADING),
            getError: actionTypeStyle(GET_ERROR),
            set: actionTypeStyle(SET),
          }
        : {},
      ...actions.create
        ?
          {
            create: actionTypeStyle(CREATE),
            createIsLoading: actionTypeStyle(CREATE_IS_LOADING),
            createError: actionTypeStyle(CREATE_ERROR),
          }
        : {},
      ...actions.update
        ?
          {
            update: actionTypeStyle(UPDATE),
            updateIsLoading: actionTypeStyle(UPDATE_IS_LOADING),
            updateError: actionTypeStyle(UPDATE_ERROR),
          }
        : {},
      ...actions.delete
        ?
          {
            delete: `${DELETE}_${actionSingle}`,
            deleteIsLoading: actionTypeStyle(DELETE_IS_LOADING),
            deleteError: actionTypeStyle(DELETE_ERROR),
          }
        : {},
      ...actions.getList
        ?
          {
            getList: actionTypeStyle(GET_LIST),
            setList: actionTypeStyle(SET_LIST),
            clearList: actionTypeStyle(CLEAR_LIST),
          }
        : {},
      ...actions.select === 'single'
        ?
          {
            select: actionTypeStyle(SELECT),
            unSelect: actionTypeStyle(UN_SELECT),
          }
        : {},
      ...actions.select === 'multiple'
        ?
          {
            selectAll: actionTypeStyle(SELECT_ALL),
            unSelectAll: actionTypeStyle(UN_SELECT_ALL),
          }
        : {},
      ...parent
        ?
          {
            getAll: actionTypeStyle(GET_ALL),
            getAllIsLoading: actionTypeStyle(GET_ALL_IS_LOADING),
            getAllError: actionTypeStyle(GET_ALL_ERROR),
            setAll: actionTypeStyle(SET_ALL),
            clearAll: actionTypeStyle(CLEAR_ALL),
          }
        : {},
    };
  }
  return {
    ...getActionTypes(SET, actionSingle),
    ...getActionTypes(SET, actionPlural, LIST),
    ...getActionTypes(CLEAR, actionPlural, LIST),
    ...(actions.get ? getAsyncActionTypes : getActionTypes)(GET, actionSingle),
    ...(actions.create ? getAsyncActionTypes : getActionTypes)(CREATE, actionSingle),
    ...(actions.update ? getAsyncActionTypes : getActionTypes)(UPDATE, actionSingle),
    ...(actions.delete ? getAsyncActionTypes : getActionTypes)(DELETE, actionSingle),
    ...(actions.getList ? getAsyncActionTypes : getActionTypes)(GET, actionPlural, LIST),
    ...actions.select
      ?
        {
          ...getActionTypes(SELECT, actionSingle),
          ...getActionTypes(UN_SELECT, actionSingle),
        }
      : {},
    ...actions.select === 'multiple'
      ?
        {
          ...getActionTypes(SELECT_ALL, actionPlural),
          ...getActionTypes(UN_SELECT_ALL, actionPlural),
        }
      : {},
    ...parent
      ?
        {
          ...getAsyncActionTypes(GET_ALL, actionPlural),
          ...getActionTypes(SET_ALL, actionPlural),
          ...getActionTypes(CLEAR_ALL, actionPlural),
        }
      : {},
    ...Object.entries(includeActions)
      .reduce((obj, [action, { isAsync }]) => 
        ({
          ...obj,
          ...isAsync
            ? getAsyncActionTypes(camelToSnakeCase(action))
            : getActionTypes(camelToSnakeCase(action)),
        }),
        {}
    ),
  };
}

export const actionTypes = formatActionTypes;

export const formatFunctionNames = (camelCaseName) => {
  // Turn "upperCamelCaseName" into UpperCamelCaseName
  const upperCamelCaseName = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);
  return {
    functionSingle: pluralToSingle(upperCamelCaseName),
    functionPlural: upperCamelCaseName,
    camelCaseNameSingle: pluralToSingle(camelCaseName),
  };
};

// Convert a list route, e.g '/api/foo' into a detail route '/api/foo/42'
// Note that trailing slashes are handled automatically: '/api/foo/' becomes '/api/foo/42/'
export const getDetailRoute = (route, id) => obj =>
  // To do: assertions for obj, route and id
  `${
    route
  }${
    route.endsWith('/') ? '' : '/'
  }${
    typeof obj === 'object' ? obj[id] : obj
  }${
    route.endsWith('/') ? '/' : ''
  }`;

export default (camelCaseName, config) => {
  const {
    route,
    axios,
    onError,
    parent,
    parentId,
    actionTypeStyle,
    id,
    actions,
    includeActions,
  } = config;
  const { functionSingle, functionPlural } = formatFunctionNames(camelCaseName);
  const { actionSingle, actionPlural } = formatActionNames(camelCaseName);
  const actionTypes = formatActionTypes(camelCaseName, config);

  
  const getParentObj = (obj) => {
    // If parent is defined, the parent is taken from the obj. Otherwise an empty object ({}) is returned
    if (!parent) return {};
    const parentFromObj = obj[parent];
    // Allow parent in object to be an object itself, if so the id is found by parentId
    return { 'parent': parentFromObj !== null && typeof parentFromObj === 'object' ? parentFromObj[parentId] : parentFromObj }
  }

  // This function is able to supply the include props function with all actions.
  const actionDispatchers = (dispatch) => ({
    ...Object.fromEntries(
      Object.keys(actionTypes).map(action => [
        action,
        obj => dispatch({
          type: actionTypes[action],
          payload: obj,
          ...getParentObj(obj),
        }),
      ]))
    });
  
  const getFromState = (getState, key) => {
    const state = getState()[camelCaseName];
    if (typeof state === 'undefined') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? Missing "${camelCaseName}" key" Initial state should include { ${camelCaseName}: { ... } } object.`;
    }
    if (typeof state !== 'object') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? "${camelCaseName}" key should have an object as value: { ${camelCaseName}: { ... } }.`;
    }
    if (typeof state[key] === 'undefined') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? State should include "${key}": { ${camelCaseName}: { ${key}: ... } }`;
    }
    return state[key];
  }

  const actionFunctions = {
    get: (id, { params = {}, callback, onError: onCallerError } = {}) => async (dispatch, getState) => {
      if (getFromState(getState, 'getIsLoading')) {
        return;
      }
      const { route, method } = actions.get;

      dispatch({ type: actionTypes.getIsLoading });
      try {
        const response = await axios[method](typeof route === 'function' ? route(id) : route, { params });
          dispatch({
            type: actionTypes.set,
            payload: response.data,
            ...getParentObj(response.data),
          });
          if (typeof callback === 'function') callback(response.data);
      } catch (error) {
        dispatch({ type: actionTypes.getError, payload: error });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    getList: ({ params = {}, callback, onError: onCallerError } = {}) => async (dispatch, getState) => {
      if (getFromState(getState, 'getListIsLoading')) {
        return;
      }
      const { route, method } = actions.getList;
      dispatch({ type: actionTypes.getList, ...getParentObj(params, parent) });
      try {
        const response = await axios[method](route, { params });
        dispatch({
          type: actionTypes.setList,
          payload: response.data,
          ...getParentObj(params),
        });
        callIfFunc(callback, response.data);
      } catch (error) {
        dispatch({
          type: actionTypes.clearList,
          ...getParentObj(params),
        });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    set: (obj) => dispatch => dispatch({
      type: actionTypes.set,
      payload: obj,
      ...getParentObj(obj),
    }),
    setList: (obj) => dispatch => dispatch({
      type: actionTypes.setList,
      payload: obj,
      ...getParentObj(obj),
    }),
    setAll: (obj) => dispatch => dispatch({
      type: actionTypes.setAll,
      payload: obj,
    }),
    clearList: (obj) => dispatch => dispatch({
      // Get parent from ownProps
      type: actionTypes.clearList,
      ...getParentObj(obj),
    }),
    create: (obj, { callback, onError: onCallerError, params } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'createIsLoading')) {
      //   return;
      // }
      const { route, method } = actions.create;
      dispatch({ type: actionTypes.createIsLoading, ...getParentObj(obj, parent) });
      try {
        const response = await axios[method](typeof route === 'function' ? route(obj) : route, obj, { params });
        dispatch({
          type: actionTypes.set,
          payload: response.data,
          ...getParentObj(response.data),
        });
        callIfFunc(callback, response.data);
      } catch (error) {
        dispatch({ type: actionTypes.createError, ...getParentObj(obj, parent), payload: error });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    update: (obj, { callback, onError: onCallerError, params } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'updateIsLoading')) {
      //   return;
      // }
      const { route, method } = actions.update;
      dispatch({ type: actionTypes.updateIsLoading, ...getParentObj(obj, parent) });
      try {
        const response = await axios[method](typeof route === 'function' ? route(obj) : route, obj, { params });
        dispatch({
          type: actionTypes.update,
          payload: response.data,
          ...getParentObj(obj),
        });
        callIfFunc(callback, response.data);
      } catch (error) {
        dispatch({ type: actionTypes.updateError, ...getParentObj(obj, parent), payload: error });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    delete: (obj, { callback, onError: onCallerError, params } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'deleteIsLoading')) {
      //   return;
      // }
      const { route, method } = actions.delete;
      dispatch({ type: actionTypes.deleteIsLoading, ...getParentObj(obj, parent) });
      try {
        const response = await axios[method](typeof route === 'function' ? route(obj) : route, obj, { params });
        dispatch({
          type: actionTypes.delete,
          payload: obj,
          ...getParentObj(obj),
        });
        callIfFunc(callback);
      } catch (error) {
        dispatch({ type: actionTypes.deleteError, ...getParentObj(obj, parent), payload: error });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    getAll : ({ callback, onError: onCallerError, params } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'getAllIsLoading')) {
      //   return;
      // }
      const { route, method } = actions.getAll;
      dispatch({ type: actionTypes.getAllIsLoading });
      try {
        const response = await axios[method](route, { params });
        dispatch({
          type: actionTypes.setAll,
          payload: response.data,
        });
        callIfFunc(callback, response.data);
      } catch (error) {
        dispatch({ type: actionTypes.getAllError, payload: error });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    clearAll: (obj) => dispatch => dispatch({
      type: actionTypes.clearAll,
    }),
    select: obj => (dispatch) => {
      dispatch({
        type: actionTypes.select,
        payload: obj,
        ...getParentObj(obj),
      })},
    unSelect: () => (dispatch, ownProps) => dispatch({
      type: actionTypes.unSelect,
      ...getParentObj(ownProps),
    }),
    selectAll: obj => (dispatch, ownProps) => dispatch({
      type: actionTypes.selectAll,
      payload: obj,
      ...getParentObj(ownProps),
    }),
    unSelectAll: obj => (dispatch, ownProps) => dispatch({
      type: actionTypes.unSelectAll,
      payload: obj,
      ...getParentObj(ownProps),
    }),
  };

  const actionsIncluded = Object.entries(includeActions)
    .filter(([action, { isAsync }]) => isAsync)
    .reduce((o, [action, { isAsync, route, method = 'get', prepare, onResponse, parent: customParent, onError: onCustomError }]) =>
      ({
        ...o,
        [action]: (obj, { params = {}, callback, onError: onCallerError, ...restArgs } = {}) =>
          async (dispatch, getState) => {
            const parentObj = !customParent
                ? getParentObj(obj, parent)
                : { 
                    parent: typeof customParent === 'function'
                      ? customParent(obj, { ...restArgs, getState, params })
                      : customParent
                  };
            
            // if (getFromState(getState, `${action}IsLoading`)) {
            //   return;
            // }
            dispatch({ type: actionTypes[`${action}IsLoading`], ...parentObj });

            try {
              const response = await axios[method](
                typeof route === 'function' ? route(obj, { ...restArgs, getState, params }) : route,
                typeof prepare === 'function' ? prepare(obj, { ...restArgs, getState, params }) : obj,
              );
              dispatch({ type: actionTypes[`${action}IsLoading`], payload: false, ...parentObj });

              onResponse(response.data, { ...actionDispatchers(dispatch) }, { ...restArgs, dispatch, getState, params });
              callIfFunc(callback, response.data);
            } catch (error) {
              dispatch({ type: actionTypes[`${action}Error`], payload: error, ...parentObj });
              callIfFunc(onError, error);
              callIfFunc(onCustomError, error);
              callIfFunc(onCallerError, error);
            };
          },
        [`${action}ClearError`]: () => dispatch => dispatch({ type: actionTypes[`${action}ClearErrored`] }),
      }),
      {}
    );
  
  return {
    actionsStripped: {
      // Get single, update if exists
      ...actions.get
        ?
          {
            get: actionFunctions.get,
            set: actionFunctions.set,
          }
        : {},
      ...actions.getList
        ?
          {
            getList: actionFunctions.getList,
            setList: actionFunctions.setList,
            clearList: actionFunctions.clearList,
          }
        : {},
      ...actions.create
        ?
          {
            create: actionFunctions.create,
            set: actionFunctions.set,
          }
        : {},
      ...actions.update
        ?
          {
            update: actionFunctions.update,
          }
        : {},
      ...actions.delete
        ?
          {
            delete: actionFunctions.delete,
          }
        : {},
      ...parent && actions.getList
        ?
          {
            getAll: actionFunctions.getAll,
            setAll: actionFunctions.setAll,
            clearAll: actionFunctions.clearAll,
          }
        : {},
      ...actions.select === 'single'
        ?
          {
            select: actionFunctions.select,
            unSelect: actionFunctions.unSelect,
          }
        : {},
      ...actions.select === 'multiple'
        ?
          {
            selectAll: actionFunctions.selectAll,
            unSelectAll: actionFunctions.unSelectAll,
          }
        : {},
      ...actionsIncluded,
    },
    actions: {
      // Get single, update if exists
      ...actions.get
        ?
          {
            [`get${functionSingle}`]: actionFunctions.get,
            [`set${functionSingle}`]: actionFunctions.set,
          }
        : {},
      ...actions.getList
        ?
          {
            [`get${functionPlural}List`]: actionFunctions.getList,
            [`set${functionPlural}List`]: actionFunctions.setList,
            [`clear${functionPlural}List`]: actionFunctions.clearList,
          }
        : {},
      ...actions.create
        ?
          {
            [`create${functionSingle}`]: actionFunctions.create,
            [`set${functionSingle}`]: actionFunctions.set,
          }
        : {},
      ...actions.update
        ?
          {
            [`update${functionSingle}`]: actionFunctions.update,
          }
        : {},
      ...actions.delete
        ?
          {
            [`delete${functionSingle}`]: actionFunctions.delete,
          }
        : {},
      ...parent && actions.getList
        ?
          {
            [`getAll${functionPlural}`]: actionFunctions.getAll,
            [`setAll${functionPlural}`]: actionFunctions.setAll,
            [`clearAll${functionPlural}`]: actionFunctions.clearAll,
          }
        : {},
      ...actions.select === 'single'
        ?
          {
            [`select${functionSingle}`]: actionFunctions.select,
            [`unSelect${functionSingle}`]: actionFunctions.unSelect,
          }
        : {},
      ...actions.select === 'multiple'
        ?
          {
            [`selectAll${functionPlural}`]: actionFunctions.selectAll,
            [`unSelectAll${functionPlural}`]: actionFunctions.unSelectAll,
          }
        : {},
      ...actionsIncluded,
    },
  };
};
