
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
const formatActionNames = objectName => {
  const actionPlural = camelToSnakeCase(objectName).toUpperCase();
  return {
    actionPlural,
    actionSingle: pluralToSingle(actionPlural),
  };
}

const formatActionTypes = (objectName, config) => {
  const {
    actionTypeStyle,
    select,
    parent,
    actions,
    includeActions,
  } = config;
  const { actionSingle, actionPlural } = formatActionNames(objectName);
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

export const formatFunctionNames = (objectName) => {
  // Turn "upperCamelCaseName" into UpperCamelCaseName
  const upperCamelCaseName = objectName.charAt(0).toUpperCase() + objectName.slice(1);
  return {
    functionSingle: pluralToSingle(upperCamelCaseName),
    functionPlural: upperCamelCaseName,
    camelCaseNameSingle: pluralToSingle(objectName),
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

export default ({ objectName, config, getAllActionDispatchers }) => {
  const {
    route,
    axios,
    onError,
    parent,
    parentId,
    actionTypeStyle,
    id,
    byKey,
    actions,
    includeActions,
  } = config;
  const { functionSingle, functionPlural } = formatFunctionNames(objectName);
  const { actionSingle, actionPlural } = formatActionNames(objectName);
  const actionTypes = formatActionTypes(objectName, config);

  
  const getParentObj = (obj) => {
    // If parent is defined, the parent is taken from the obj. Otherwise an empty object ({}) is returned
    if (!parent) return {};
    const parentFromObj = obj[parent];
    // Allow parent in object to be an object itself, if so the id is found by parentId
    return { 'parent': parentFromObj !== null && typeof parentFromObj === 'object' ? parentFromObj[parentId] : parentFromObj }
  }
  const mapActions = {
    get: `get${functionSingle}`,
    set: `set${functionSingle}`,
    getList: `get${functionPlural}List`,
    setList: `set${functionPlural}List`,
    clearList: `clear${functionPlural}List`,
    create: `create${functionSingle}`,
    set: `set${functionSingle}`,
    update: `update${functionSingle}`,
    delete: `delete${functionSingle}`,
    getAll: `getAll${functionPlural}`,
    setAll: `setAll${functionPlural}`,
    clearAll: `clearAll${functionPlural}`,
    select: `select${functionSingle}`,
    unSelect: `unSelect${functionSingle}`,
    selectAll: `selectAll${functionPlural}`,
    unSelectAll: `unSelectAll${functionPlural}`,
  }

  // This function is able to supply callbacks with all actions.
  const actionDispatchersStripped = dispatch => Object.fromEntries(
    Object.keys(actionTypes).map(action => [
      action,
      obj => dispatch({
        type: actionTypes[action],
        payload: obj,
        ...action.endsWith('All') ? {} : getParentObj(obj),
      }),
    ])
  );
  // actionDispatchers is created and returned to caller. There, actionDispatchers of all factories are 
  // combined and can be obtained using getAllActionDispatchers(dispatch)
  const actionDispatchers = dispatch => Object.fromEntries(
    Object.keys(actionTypes)
      .filter(action => !!mapActions[action])
      .map(action => [
        mapActions[action],
        obj => dispatch({
          type: actionTypes[action],
          payload: obj,
          ...action.endsWith('All') ? {} : getParentObj(obj),
        }),
      ])
  );
  
  // Each callback or onResponse function will get the actions of all factories (getFooList(), createBar() etc) and also 
  // the stripped actions (setList(), create() etc) of this particular factory. This allows callbacks to trigger specific actions (createFoo()) and
  // also create reusable callbacks for different factories that use the stripped action (create())
  const combineActionDispatchers = dispatch => ({
    ...getAllActionDispatchers(dispatch),
    ...actionDispatchersStripped(dispatch),
  });
  
  const getFromState = (getState, key) => {
    const state = getState()[objectName];
    if (typeof state === 'undefined') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? Missing "${objectName}" key" Initial state should include { ${objectName}: { ... } } object.`;
    }
    if (typeof state !== 'object') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? "${objectName}" key should have an object as value: { ${objectName}: { ... } }.`;
    }
    if (typeof state[key] === 'undefined') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? State should include "${key}": { ${objectName}: { ${key}: ... } }`;
    }
    return state[key];
  }

  // Generic call to Axios which handles multiple methods and route & prepare functions
  const _axios = ({ method, route, params, obj, original, axiosConfig={}, args, getState, prepare }) => axios({
    ...axiosConfig,
    method,
    url: typeof route === 'function' ? route(original ? original : obj, { args, getState, params }) : route, 
    params,
    ...obj
      ? { data: typeof prepare === 'function' ? prepare(obj, args, { getState, params }) : obj }
      : {},
  });

  // const _asyncAction = (obj, { params = {}, callback, onError: onCallerError, axiosConfig } = {}, action ) => async (dispatch, getState) => {
  //   const { route, method, prepare } = actions[action];

  //   dispatch({ type: actionTypes[`${action}IsLoading`], ...getParentObj(obj ? obj : params, parent) });
  //   try {
  //     const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, prepare });
  //     const responseAction = (
  //       action === 'get' || action === 'create'
  //       ? 'set'
  //       : action === 'getList'
  //       ? 'setList'
  //       : action === 'getAll'
  //       ? 'setAll'
  //       : action
  //     )
  //     dispatch({
  //       type: actionTypes[responseAction],
  //       payload: response.data,
  //       ...getParentObj(response.data),
  //     });
  //     callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
  //   } catch (error) {
  //     dispatch({ type: actionTypes.getError, payload: error });
  //     callIfFunc(onError, error);
  //     callIfFunc(onCallerError, error);
  //   };
  // }

  const actionFunctions = {
    get: (obj, { params = {}, callback, onError: onCallerError, axiosConfig, args } = {}) => async (dispatch, getState) => {
      if (getFromState(getState, 'getIsLoading')) {
        return;
      }
      const { route, method, prepare } = actions.get;

      dispatch({ type: actionTypes.getIsLoading, ...getParentObj(typeof obj === 'object' ? obj : params, parent)  });
      try {
        const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.set,
          payload: response.data,
          ...getParentObj(response.data),
        });
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
      } catch (error) {
        dispatch({ type: actionTypes.getError, payload: error });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    getList: ({ params = {}, callback, onError: onCallerError, axiosConfig, args } = {}) => async (dispatch, getState) => {
      if (getFromState(getState, 'getListIsLoading')) {
        return;
      }
      const { route, method, prepare } = actions.getList;
      dispatch({ type: actionTypes.getList, ...getParentObj(params, parent) });
      try {
        const response = await _axios({ method, route, params, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.setList,
          payload: response.data,
          ...getParentObj(params),
        });
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
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
    create: (obj, { callback, onError: onCallerError, params, axiosConfig, args } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'createIsLoading')) {
      //   return;
      // }
      const { route, method, prepare } = actions.create;
      dispatch({ type: actionTypes.createIsLoading, ...getParentObj(obj, parent) });
      try {
        const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.set,
          payload: response.data,
          ...getParentObj(response.data),
        });
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
      } catch (error) {
        dispatch({ type: actionTypes.createError, ...getParentObj(obj, parent), payload: error });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    update: (obj, { original, callback, onError: onCallerError, params, axiosConfig, args } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'updateIsLoading')) {
      //   return;
      // }
      const { route, method, prepare } = actions.update;
      
      dispatch({
        type: actionTypes.updateIsLoading,
        ...getParentObj(original ? original : obj, parent),
      });
      try {
        const response = await _axios({ method, route, params, obj, original, axiosConfig, getState, args, prepare });
        if (parent && original[parent] !== response.data[parent]) {
          // The parent key of the object has changed. The sub reducer will not be able to find it and the
          // most straight forward option is to delete the original object and create it again
          dispatch({
            type: actionTypes.delete,
            payload: original,
            ...getParentObj(original, parent),
          });
        }
        dispatch({
          type: actionTypes.update,
          payload: response.data,
          ...getParentObj(obj, parent),
          // Send unmutable id to be able to remove the object if byKey has changed
          key: typeof original === 'object' ? original[byKey] || null : null,
          id: typeof original === 'object' ? original[id] || null : null,
        });
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
      } catch (error) {
        dispatch({
          type: actionTypes.updateError,
          ...getParentObj(obj, parent),
          payload: error,
        });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    delete: (obj, { callback, onError: onCallerError, params, axiosConfig, args } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'deleteIsLoading')) {
      //   return;
      // }
      const { route, method, prepare } = actions.delete;
      dispatch({ type: actionTypes.deleteIsLoading, ...getParentObj(obj, parent) });
      try {
        const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.delete,
          payload: obj,
          ...getParentObj(obj),
        });
        callIfFunc(callback, combineActionDispatchers(dispatch));
      } catch (error) {
        dispatch({ type: actionTypes.deleteError, ...getParentObj(obj, parent), payload: error });
        callIfFunc(onError, error);
        callIfFunc(onCallerError, error);
      };
    },
    getAll : ({ callback, onError: onCallerError, params, axiosConfig, args } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'getAllIsLoading')) {
      //   return;
      // }
      const { route, method, prepare } = actions.getAll;
      dispatch({ type: actionTypes.getAllIsLoading });
      try {
        const response = await _axios({ method, route, params, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.setAll,
          payload: response.data,
        });
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
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
    .reduce((o, [action, { isAsync, route, method = 'get', prepare, onResponse, parent: customParent, onError: onCustomError, axiosConfig }]) =>
      ({
        ...o,
        [action]: (obj, { params = {}, callback, onError: onCallerError, args } = {}) =>
          async (dispatch, getState) => {
            const parentObj = !customParent
                ? getParentObj(obj, parent)
                : { 
                    parent: typeof customParent === 'function'
                      ? customParent(obj, { args, getState, params })
                      : customParent
                  };
            
            // if (getFromState(getState, `${action}IsLoading`)) {
            //   return;
            // }
            dispatch({ type: actionTypes[`${action}IsLoading`], ...parentObj });

            try {
              const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, obj, prepare });
              dispatch({ type: actionTypes[`${action}IsLoading`], payload: false, ...parentObj });

              onResponse(
                response.data,
                combineActionDispatchers(dispatch),
                { args, dispatch, getState, params }
              );
              callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
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
  
  const actionsList = [
      ...actions.get ? ['get', 'set'] : [],
      ...actions.getList ? ['getList', 'setList', 'clearList'] : [],
      ...actions.create ? ['create', 'set'] : [],
      ...actions.update ? ['update'] : [],
      ...actions.delete ? ['delete'] : [],
      ...parent && actions.getAll ? ['getAll', 'setAll', 'clearAll'] : [],
      ...actions.select === 'single' ? ['select', 'unSelect'] : [],
      ...actions.select === 'multiple' ? ['selectAll', 'unSelectAll']: [],
  ];

  return {
    actionsStripped: {
      ...actionsList.reduce((o, action) => ({ ...o, [action]: actionFunctions[action]}), {}),
      ...actionsIncluded,
    },
    actions: {
      ...actionsList.reduce((o, action) => ({ ...o, [mapActions[action]]: actionFunctions[action]}), {}),
      ...actionsIncluded,
    },
    actionDispatchers,
  };
};
