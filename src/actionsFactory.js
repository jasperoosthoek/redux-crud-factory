
import { callIfFunc, camelToSnakeCase, snakeToCamelCase, toUpperCamelCase, pluralToSingle } from './utils';

const IS_LOADING = 'IS_LOADING';
const HAS_ERRORED = 'HAS_ERRORED';
const CLEAR_ERROR = 'CLEAR_ERROR';
const GET = 'GET';
const GET_IS_LOADING = 'GET_IS_LOADING';
const LIST = 'LIST';
const SET = 'SET';
const GET_LIST = 'GET_LIST';
const SET_LIST = 'SET_LIST';
const GET_ALL = 'GET_ALL';
const CLEAR_ALL = 'CLEAR_ALL';
const SET_ALL = 'SET_ALL';
const CREATE = 'CREATE';
const CREATE_IS_LOADING = 'CREATE_IS_LOADING';
const UPDATE = 'UPDATE';
const UPDATE_IS_LOADING = 'UPDATE_IS_LOADING';
const DELETE = 'DELETE';
const DELETE_IS_LOADING = 'DELETE_IS_LOADING';
const SELECT = 'SELECT';
const SELECT_ALL = 'SELECT_ALL';
const UN_SELECT = 'UN_SELECT';
const UN_SELECT_ALL = 'UN_SELECT_ALL';
const CLEAR = 'CLEAR';
const CLEAR_LIST = 'CLEAR_LIST';
const GET_ALL_IS_LOADING = 'GET_ALL_IS_LOADING';

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
    [`${func}HasErrored`]: `${action}_${HAS_ERRORED}`,
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
            set: actionTypeStyle(SET),
          }
        : {},
      ...actions.create
        ?
          {
            create: actionTypeStyle(CREATE),
            createIsLoading: actionTypeStyle(CREATE_IS_LOADING),
          }
        : {},
      ...actions.update
        ?
          {
            update: actionTypeStyle(UPDATE),
            updateIsLoading: actionTypeStyle(UPDATE_IS_LOADING),
          }
        : {},
      ...actions.delete
        ?
          {
            delete: `${DELETE}_${actionSingle}`,
            deleteIsLoading: actionTypeStyle(DELETE_IS_LOADING),
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
            setAll: actionTypeStyle(SET_ALL),
            clearAll: actionTypeStyle(CLEAR_ALL),
          }
        : {},
    };
  }
  return {

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
    ...getActionTypes(SET, actionPlural),
    ...getActionTypes(SET, actionPlural, LIST),
    ...getActionTypes(CLEAR, actionPlural, LIST),
    ...(actions.get ? getAsyncActionTypes : getActionTypes)(GET, actionPlural),
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
  };
}

// If parent is defined, the parent is taken from the obj. Otherwise an empty object ({}) is returned
const getParent = (obj, parent) => {
  return parent ? { 'parent': obj[parent] } : {};
}

export const actionTypes = formatActionTypes;

export const formatFunctionNames = (camelCaseName) => {
  // Turn "upperCamelCaseName" into UpperCamelCaseName
  const upperCamelCaseName = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);
  return {
    // Naive way of making single from plural. Need to adapt when using words like "categories"
    functionSingle: pluralToSingle(upperCamelCaseName),
    functionPlural: upperCamelCaseName,
  };
};


export default (camelCaseName, config) => {
  const {
    route,
    axios,
    onError,
    parent,
    actionTypeStyle,
    id,
    actions,
    includeActions,
  } = config;
  const { functionSingle, functionPlural } = formatFunctionNames(camelCaseName);
  const { actionSingle, actionPlural } = formatActionNames(camelCaseName);
  const actionTypes = formatActionTypes(camelCaseName, config);

  const actionDispatchers = (dispatch) => ({
    ...Object.fromEntries(
      Object.keys(actionTypes).map(action => [
        action,
        obj => dispatch({
          type: actionTypes[action],
          payload: obj,
          ...getParent(obj, parent),
        }),
      ]))
    });

  const actionFunctions = {
    get: (id, { params = {}, callback } = {}) => async dispatch => {
      dispatch({ type: actionTypes.getIsLoading });
      try {
        const response = await axios.get(`${route}${id}/`, { params });
          dispatch({
            type: actionTypes.get,
            payload: response.data,
            ...getParent(response.data, parent),
          });
          if (typeof callback === 'function') callback(response.data);
      } catch (error) {
        callIfFunc(onError, error);
      };
    },
    getList: ({ params = {}, callback } = {}) => async (dispatch, getState) => {
      const { getListIsLoading } = getState()[camelCaseName];
      if (getListIsLoading) {
        return;
      }
      dispatch({ type: actionTypes.getList, ...getParent(params, parent) });
      try {
        const response = await axios.get(route, { params });
        dispatch({
          type: actionTypes.setList,
          payload: response.data,
          ...getParent(params, parent),
        });
      } catch (error) {
        callIfFunc(onError, error);
        dispatch({
          type: actionTypes.clearList,
          ...getParent(params, parent),
        });
      };
    },
    clearList: (obj) => dispatch => dispatch({
      // Get parent from ownProps
      type: actionTypes.clearList,
      ...getParent(obj, parent),
    }),
    create: (obj, { callback } = {}) => async dispatch => {
      dispatch({ type: actionTypes.createIsLoading, ...getParent(obj, parent) });
      try {
        const response = await axios.post(route, obj);
        dispatch({
          type: actionTypes.create,
          payload: response.data,
          ...getParent(response.data, parent),
        });
        if (typeof callback === 'function') callback(response.data);
      } catch (error) {
        callIfFunc(onError, error);
      };
    },
    update: (obj, { callback } = {}) => async dispatch => {
      dispatch({ type: actionTypes.updateIsLoading, ...getParent(obj, parent) });
      try {
        const response = await axios.patch(`${route}${obj[id]}/`, obj);
          dispatch({
            type: actionTypes.update,
            payload: response.data,
            ...getParent(obj, parent),
          });
          if (typeof callback === 'function') callback(response.data);
      } catch (error) {
        callIfFunc(onError, error);
      };
    },
    delete: (obj, { callback } = {}) => async dispatch => {
      console.log({ obj })
      dispatch({ type: actionTypes.deleteIsLoading, ...getParent(obj, parent) });
      try {
        const response = await axios.delete(`${route}${obj[id]}/`);
          dispatch({
            type: actionTypes.delete,
            payload: obj,
            ...getParent(obj, parent),
          });
          if (typeof callback === 'function') callback(obj);
      } catch (error) {
        callIfFunc(onError, error);
      };
    },
    getAll : (params = {}) => async (dispatch, getState) => {
      const { getAllIsLoading } = getState()[camelCaseName];
      if (getAllIsLoading) {
        return;
      }
      dispatch({ type: actionTypes.getAllIsLoading });
      try {
        const response = await axios.get(route, { params });
        dispatch({
          type: actionTypes.setAll,
          payload: response.data,
        });
      } catch (error) {
        callIfFunc(onError, error);
      };
    },
    clearAll: (obj) => dispatch => dispatch({
      type: actionTypes.clearAll,
    }),
    select: obj => (dispatch) => {
      dispatch({
        type: actionTypes.select,
        payload: obj,
        ...getParent(obj, parent),
      })},
    unSelect: () => (dispatch, ownProps) => dispatch({
      type: actionTypes.unSelect,
      ...getParent(ownProps, parent),
    }),
    selectAll: obj => (dispatch, ownProps) => dispatch({
      type: actionTypes.selectAll,
      payload: obj,
      ...getParent(ownProps, parent),
    }),
    unSelectAll: obj => (dispatch, ownProps) => dispatch({
      type: actionTypes.unSelectAll,
      payload: obj,
      ...getParent(ownProps, parent),
    }),
  };

  const actionsIncluded = Object.entries(includeActions)
    .filter(([action, { isAsync }]) => isAsync)
    .reduce((obj, [action, { isAsync, route, method = 'get', onResponse, onError: onErrorDefault }]) =>
      ({
        ...obj,
        [action]: (obj, { params = {}, callback, onError } = {}) =>
          async (dispatch, getState) => {
            dispatch({ type: actionTypes[`${action}IsLoading`] });
            try {
              const response = await axios[method](
                typeof route === 'function' ? route(obj) : route,
                { params }
              );
              onResponse(actionDispatchers(dispatch), response.data, { dispatch, getState, params });
              if (typeof callback === 'function') {
                callback(response.data);
              };
            } catch (error) {
              console.error(error);
              dispatch({ type: actionTypes[`${action}HasErrored`] });
              if (typeof onError === 'function') {
                callIfFunc(onError, error);
              }
              if (typeof onErrorDefault === 'function') {
                callIfFunc(onError, error);
              }
            };
          },
        [`${action}ClearError`]: () => dispatch => dispatch({ type: actionTypes[`${action}ClearErrored`] }),
      }),
      {}
    );
  
  return {
    actionsStripped: {
      ...actionsIncluded,
      // Get single, update if exists
      ...actions.get
        ?
          {
            get: actionFunctions.get,
          }
        : {},
      ...actions.getList
        ?
          {
            getList: actionFunctions.getList,
            clearList: actionFunctions.clearList,
          }
        : {},
      ...actions.create
        ?
          {
            create: actionFunctions.create,
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
    },
    actions: {
      ...actionsIncluded,
      // Get single, update if exists
      ...actions.get
        ?
          {
            [`get${functionSingle}`]: actionFunctions.get,
          }
        : {},
      ...actions.getList
        ?
          {
            [`get${functionPlural}List`]: actionFunctions.getList,
            [`clear${functionPlural}List`]: actionFunctions.clearList,
          }
        : {},
      ...actions.create
        ?
          {
            [`create${functionSingle}`]: actionFunctions.create,
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
    },
  };
};
