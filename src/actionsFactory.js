
import { callIfFunc, camelToSnakeCase, snakeToCamelCase, toUpperCamelCase, pluralToSingle, titleCase } from './utils';

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


const getActionTypesIncludeState = (propName, objectName) => {
  const propNameUpperSnakeCase = camelToSnakeCase(propName).toUpperCase()
  const objectNameUpperSnakeCase = camelToSnakeCase(objectName).toUpperCase()
  return (
    {
      [`set${titleCase(propName)}`]: `${SET}_${objectNameUpperSnakeCase}_STATE_${propNameUpperSnakeCase}`,
      [`clear${titleCase(propName)}`]: `${CLEAR}_${objectNameUpperSnakeCase}_STATE_${propNameUpperSnakeCase}`,
    }
  );
};

export const formatActionAndFunctionNames = objectName => {
  // Turn "upperCamelCaseName" into UpperCamelCaseName
  const upperCamelCaseName = titleCase(objectName);
  const actionPlural = camelToSnakeCase(objectName).toUpperCase();
  return {
    functionSingle: pluralToSingle(upperCamelCaseName),
    functionPlural: upperCamelCaseName,
    camelCaseNameSingle: pluralToSingle(objectName),
    actionPlural,
    actionSingle: pluralToSingle(actionPlural),
  };
};

const formatActionTypes = (objectName, config) => {
  const {
    actionTypeStyle,
    select,
    parent,
    actions,
    includeActions,
    includeState,
  } = config;
  const { actionSingle, actionPlural } = formatActionAndFunctionNames(objectName);
  
  // if (typeof actionTypeStyle == 'function') {
  //   return {
  //     set: actionTypeStyle(SET),
  //     clear: actionTypeStyle(CLEAR),
  //     ...actions.get
  //       ?
  //         {
  //           get: actionTypeStyle(GET),
  //           getIsLoading: actionTypeStyle(GET_IS_LOADING),
  //           getError: actionTypeStyle(GET_ERROR),
  //         }
  //       : {},
  //     ...actions.create
  //       ?
  //         {
  //           create: actionTypeStyle(CREATE),
  //           createIsLoading: actionTypeStyle(CREATE_IS_LOADING),
  //           createError: actionTypeStyle(CREATE_ERROR),
  //         }
  //       : {},
  //     ...actions.update
  //       ?
  //         {
  //           update: actionTypeStyle(UPDATE),
  //           updateIsLoading: actionTypeStyle(UPDATE_IS_LOADING),
  //           updateError: actionTypeStyle(UPDATE_ERROR),
  //         }
  //       : {},
  //     ...actions.delete
  //       ?
  //         {
  //           delete: `${DELETE}_${actionSingle}`,
  //           deleteIsLoading: actionTypeStyle(DELETE_IS_LOADING),
  //           deleteError: actionTypeStyle(DELETE_ERROR),
  //         }
  //       : {},
  //     ...actions.getList
  //       ?
  //         {
  //           getList: actionTypeStyle(GET_LIST),
  //           setList: actionTypeStyle(SET_LIST),
  //           clearList: actionTypeStyle(CLEAR_LIST),
  //         }
  //       : {},
  //     ...actions.select === 'single'
  //       ?
  //         {
  //           select: actionTypeStyle(SELECT),
  //           unSelect: actionTypeStyle(UN_SELECT),
  //         }
  //       : {},
  //     ...actions.select === 'multiple'
  //       ?
  //         {
  //           selectAll: actionTypeStyle(SELECT_ALL),
  //           unSelectAll: actionTypeStyle(UN_SELECT_ALL),
  //         }
  //       : {},
  //     ...parent
  //       ?
  //         {
  //           getAll: actionTypeStyle(GET_ALL),
  //           getAllIsLoading: actionTypeStyle(GET_ALL_IS_LOADING),
  //           getAllError: actionTypeStyle(GET_ALL_ERROR),
  //           setAll: actionTypeStyle(SET_ALL),
  //           clearAll: actionTypeStyle(CLEAR_ALL),
  //         }
  //       : {},
  //   };
  // }

  const actionTypesAsync = {
    isLoading: {},
    error: {},
    clearError: {},
  }
  const getAsyncActionTypes = (actionPrefix, actionName, actionSuffix) => {
    const func = `${snakeToCamelCase(actionPrefix)}${actionSuffix ? toUpperCamelCase(actionSuffix) : ''}`;
    const action = `${actionPrefix}${actionName ? `_${actionName}` : ''}${actionSuffix ? `_${actionSuffix}` : ''}`;

    actionTypesAsync.isLoading[func] = `${action}_${IS_LOADING}`;
    actionTypesAsync.error[func] = `${action}_${ERROR}`;
    actionTypesAsync.clearError[func] = `${action}_${CLEAR_ERROR}`;

    return { [func]: action };
  }
  const actionTypes = {
    actions: {
      ...getActionTypes(SET, actionSingle),
      ...getActionTypes(CLEAR, actionSingle),
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
    },
    includeActions: {
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
    },
    includeState: {
      ...Object.keys(includeState)
        .reduce((obj, propName) => 
          ({
            ...obj,
            ...getActionTypesIncludeState(propName, objectName),
          }),
          {}
      ),
    },
  };

  return {
    ...actionTypes,
    ...actionTypesAsync,
  };
}

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

export default ({ objectName, config, getAllActionDispatchers, getActionDispatchersStripped }) => {
  const {
    route,
    axios,
    onError: globalOnError,
    parent,
    parentId,
    actionTypeStyle,
    id,
    byKey,
    actions,
    includeActions,
    includeState,
  } = config;
  const { functionSingle, functionPlural } = formatActionAndFunctionNames(objectName);
  const actionTypes = formatActionTypes(objectName, config);
  
  const getParentObj = (obj) => {
    // If parent is defined, the parent is taken from the obj. Otherwise an empty object ({}) is returned
    if (!parent) return {};
    const parentFromObj = obj[parent];
    // Allow parent in object to be an object itself, if so the id is found by parentId
    return { 'parent': parentFromObj !== null && typeof parentFromObj === 'object' ? parentFromObj[parentId] : parentFromObj }
  }
  
  const getFromState = (getState, action, key) => {
    const state = getState()[objectName];
    if (typeof state === 'undefined') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? Missing "${objectName}" action" Initial state should include { ${objectName}: { ... } } object.`;
    }
    if (typeof state !== 'object') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? "${objectName}" action should have an object as value: { ${objectName}: { ... } }.`;
    }
    if (typeof state.actions[action] === 'undefined') {
      throw `ReduxCrudFactory: Redux state has not been properly initialized. Did you register the reducer? State should include "${action}": { ${objectName}: { ${action}: ... } }`;
    }
    return state.actions[action][key];
  }

  // Generic call to Axios which handles multiple methods and route & prepare functions
  const _axios = ({ method, route, params, obj, original, axiosConfig={}, args, getState, prepare }) => axios({
    ...axiosConfig,
    method,
    url: typeof route === 'function' ? route(original ? original : obj, { args, getState, params }) : route, 
    params,
    ...obj
      ? { data: typeof prepare === 'function' ? prepare(obj, { args, getState, params }) : obj }
      : {},
  });
  
  // Each callback or onResponse function will get the actions of all factories (getFooList(), createBar() etc) and also 
  // the stripped actions (setList(), create() etc) of this particular factory. This allows callbacks to trigger specific actions (createFoo()) and
  // also create reusable callbacks for different factories that use the stripped action (create())
  const combineActionDispatchers = dispatch => ({
    ...getAllActionDispatchers(dispatch),
    ...getActionDispatchersStripped(objectName)(dispatch),
  });

  const actionFunctions = {
    get: (obj, { params = {}, callback, onError: callerOnError, axiosConfig, args } = {}) => async (dispatch, getState) => {
      if (getFromState(getState, 'getIsLoading')) {
        return;
      }
      const { route, method, prepare, callback: actionCallback, onError: actionOnError } = actions.get;

      dispatch({ type: actionTypes.isLoading.get, ...getParentObj(typeof obj === 'object' ? obj : params, parent)  });
      try {
        const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.actions.set,
          payload: response.data,
          ...getParentObj(response.data),
        });
        callIfFunc(actionCallback, response.data, combineActionDispatchers(dispatch));
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
        return response.data
      } catch (error) {
        dispatch({ type: actionTypes.error.get, payload: error });
        callIfFunc(globalOnError, error);
        callIfFunc(actionOnError, error);
        callIfFunc(callerOnError, error);
      };
    },
    getList: ({ params = {}, callback, onError: callerOnError, axiosConfig, args } = {}) => async (dispatch, getState) => {
      if (getFromState(getState, 'getList', 'isLoading')) {
        return;
      }
      const { route, method, prepare, prepareResponse, callback: actionCallback, onError: actionOnError } = actions.getList;
      dispatch({ type: actionTypes.isLoading.getList, ...getParentObj(params, parent) });
      try {
        const response = await _axios({ method, route, params, axiosConfig, getState, args, prepare });
        const responseData = typeof prepareResponse === 'function'
          ? prepareResponse(
              response.data,
              { 
                args,
                dispatch,
                getState,
                params,
                ...combineActionDispatchers(dispatch),
              }
            )
          : response.data;
        dispatch({
          type: actionTypes.actions.setList,
          payload: responseData,
          ...getParentObj(params),
        });
        callIfFunc(actionCallback, responseData, combineActionDispatchers(dispatch));
        callIfFunc(callback, responseData, combineActionDispatchers(dispatch));
        return responseData
      } catch (error) {
        dispatch({
          type: actionTypes.actions.clearList,
          ...getParentObj(params),
        });
        callIfFunc(globalOnError, error);
        callIfFunc(actionOnError, error);
        callIfFunc(callerOnError, error);
      };
    },
    set: (obj) => dispatch => dispatch({
      type: actionTypes.actions.set,
      payload: obj,
      ...getParentObj(obj),
    }),
    clear: (obj) => dispatch => dispatch({
      type: actionTypes.actions.clear,
      payload: obj,
      ...getParentObj(obj),
    }),
    setList: (obj) => dispatch => dispatch({
      type: actionTypes.actions.setList,
      payload: obj,
      ...getParentObj(obj),
    }),
    setAll: (obj) => dispatch => dispatch({
      type: actionTypes.actions.setAll,
      payload: obj,
    }),
    clearList: (obj) => dispatch => dispatch({
      // Get parent from ownProps
      type: actionTypes.actions.clearList,
      ...getParentObj(obj),
    }),
    create: (obj, { callback, onError: callerOnError, params, axiosConfig, args } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'create', 'isLoading')) {
      //   return;
      // }
      const { route, method, prepare, callback: actionCallback, onError: actionOnError } = actions.create;
      dispatch({ type: actionTypes.isLoading.create, ...getParentObj(obj, parent) });
      try {
        const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.actions.set,
          payload: response.data,
          ...getParentObj(response.data),
        });
        callIfFunc(actionCallback, response.data, combineActionDispatchers(dispatch));
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
        return response.data
      } catch (error) {
        dispatch({ type: actionTypes.error.create, ...getParentObj(obj, parent), payload: error });
        callIfFunc(globalOnError, error);
        callIfFunc(actionOnError, error);
        callIfFunc(callerOnError, error);
      };
    },
    update: (obj, { original, callback, onError: callerOnError, params, axiosConfig, args } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'update', 'isLoading')) {
      //   return;
      // }
      const { route, method, prepare, callback: actionCallback, onError: actionOnError } = actions.update;
      
      dispatch({
        type: actionTypes.isLoading.update,
        ...getParentObj(original ? original : obj, parent),
      });
      try {
        const response = await _axios({ method, route, params, obj, original, axiosConfig, getState, args, prepare });
        if (parent && typeof original === 'object' && original[parent] !== response.data[parent]) {
          // The parent key of the object has changed. The sub reducer will not be able to find it and the
          // most straight forward option is to delete the original object and create it again
          dispatch({
            type: actionTypes.actions.clear,
            payload: original,
            ...getParentObj(original, parent),
          });
        }
        dispatch({
          type: actionTypes.actions.update,
          payload: response.data,
          ...getParentObj(obj, parent),
          // Send unmutable id to be able to remove the object if byKey has changed
          key: typeof original === 'object' ? original[byKey] || null : null,
          id: typeof original === 'object' ? original[id] || null : null,
        });
        callIfFunc(actionCallback, response.data, combineActionDispatchers(dispatch));
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
        return response.data
      } catch (error) {
        dispatch({
          type: actionTypes.error.update,
          ...getParentObj(obj, parent),
          payload: error,
        });
        callIfFunc(globalOnError, error);
        callIfFunc(actionOnError, error);
        callIfFunc(callerOnError, error);
      };
    },
    delete: (obj, { callback, onError: callerOnError, params, axiosConfig, args } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'delete', 'isLoading')) {
      //   return;
      // }
      const { route, method, prepare, callback: actionCallback, onError: actionOnError } = actions.delete;
      dispatch({ type: actionTypes.isLoading.delete, ...getParentObj(obj, parent) });
      try {
        const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.actions.clear,
          payload: obj,
          ...getParentObj(obj),
        });
        callIfFunc(actionCallback, combineActionDispatchers(dispatch));
        callIfFunc(callback, combineActionDispatchers(dispatch));
        return true;
      } catch (error) {
        dispatch({ type: actionTypes.error.delete, ...getParentObj(obj, parent), payload: error });
        callIfFunc(globalOnError, error);
        callIfFunc(actionOnError, error);
        callIfFunc(callerOnError, error);
      };
    },
    getAll : ({ callback, onError: callerOnError, params, axiosConfig, args } = {}) => async (dispatch, getState) => {
      // if (getFromState(getState, 'getAll', 'isLoading')) {
      //   return;
      // }
      const { route, method, prepare, callback: actionCallback, onError: actionOnError } = actions.getAll;
      dispatch({ type: actionTypes.isLoading.getAll });
      try {
        const response = await _axios({ method, route, params, axiosConfig, getState, args, prepare });
        dispatch({
          type: actionTypes.actions.setAll,
          payload: response.data,
        });
        callIfFunc(actionCallback, response.data, combineActionDispatchers(dispatch));
        callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
        return response.data
      } catch (error) {
        dispatch({ type: actionTypes.error.getAll, payload: error });
        callIfFunc(globalOnError, error);
        callIfFunc(actionOnError, error);
        callIfFunc(callerOnError, error);
      };
    },
    clearAll: () => dispatch => dispatch({
      type: actionTypes.actions.clearAll,
    }),
    select: obj => (dispatch) => dispatch({
        type: actionTypes.actions.select,
        payload: obj,
        ...getParentObj(obj),
      }),
    unSelect: obj => (dispatch, ownProps) => dispatch({
      type: actionTypes.actions.unSelect,
      ...actions.select === 'multiple' ? { payload: obj } : {},
      ...getParentObj(ownProps),
    }),
    selectAll: obj => (dispatch, ownProps) => dispatch({
      type: actionTypes.actions.selectAll,
      payload: obj,
      ...getParentObj(ownProps),
    }),
    unSelectAll: obj => (dispatch, ownProps) => dispatch({
      type: actionTypes.actions.unSelectAll,
      payload: obj,
      ...getParentObj(ownProps),
    }),
  };

  const asyncActionsIncluded = Object.entries(includeActions)
    .filter(([action, { isAsync }]) => isAsync)
    .reduce((o, [action, { isAsync, route, method = 'get', prepare, onResponse, parent: customParent, onError: onCustomError, axiosConfig }]) =>
      ({
        ...o,
        [action]: (obj, { params = {}, callback, onError: callerOnError, args } = {}) =>
          async (dispatch, getState) => {
            const parentObj = !customParent
              ? getParentObj(obj, parent)
              : { 
                  parent: typeof customParent === 'function'
                    ? customParent(obj, { args, getState, params })
                    : customParent
                };
            dispatch({ type: actionTypes.isLoading[action], ...parentObj });

            try {
              const response = await _axios({ method, route, params, obj, axiosConfig, getState, args, obj, prepare });
              dispatch({ type: actionTypes.isLoading[action], payload: false, ...parentObj });

              callIfFunc(
                onResponse,
                response.data,
                {
                  obj,
                  args,
                  dispatch,
                  getState,
                  params,
                  ...combineActionDispatchers(dispatch),
                }
              );
              callIfFunc(callback, response.data, combineActionDispatchers(dispatch));
              return response.data;
            } catch (error) {
              dispatch({ type: actionTypes.error[action], payload: error, ...parentObj });
              callIfFunc(globalOnError, error);
              callIfFunc(onCustomError, error);
              callIfFunc(callerOnError, error);
            };
          },
        [`${action}ClearError`]: () => dispatch => dispatch({ type: actionTypes.error[action] }),
      }),
      {}
    );
  const syncActionsIncluded = Object.entries(includeState).reduce(
    (o, [propName]) => {
      const propNameTitleCase = titleCase(propName);
      const actionTypes = getActionTypesIncludeState(propName, objectName)
      return (
        {
          ...o,
          [`set${propNameTitleCase}`]:
            newValue => dispatch => dispatch({
              type: actionTypes[`set${propNameTitleCase}`],
              payload: newValue,
            }),
          [`clear${propNameTitleCase}`]:
            newValue => dispatch => dispatch({
              type: actionTypes[`clear${propNameTitleCase}`],
              payload: newValue,
            }),
        }
      );
    }, {})
  
  const asyncActionsList = [
      ...actions.get ? ['get'] : [],
      ...actions.getList ? ['getList'] : [],
      ...actions.create ? ['create'] : [],
      ...actions.update ? ['update'] : [],
      ...actions.delete ? ['delete'] : [],
      ...parent && actions.getAll ? ['getAll'] : [],
      ...Object.keys(includeActions),
  ];
  const syncActionsList = [
    'set',
    'clear',
    ...actions.getList ? ['setList', 'clearList'] : [],
    ...actions.select ? ['select', 'unSelect'] : [],
    ...actions.select === 'multiple' ? ['selectAll', 'unSelectAll']: [],
    ...parent && actions.getAll ? ['setAll', 'clearAll'] : [],
    ...Object.keys(includeState).reduce((o, propName) =>
      [ ...o, `set${titleCase(propName)}`, `clear${titleCase(propName)}`], []
    )
  ];

  const mapActions = {
    get: `get${functionSingle}`,
    set: `set${functionSingle}`,
    clear: `clear${functionSingle}`,
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

  const asyncActionsStripped = asyncActionsList.reduce((o, action) => ({ ...o, [action]: actionFunctions[action]}), {})
  const syncActionsStripped = syncActionsList.reduce((o, action) => ({ ...o, [action]: actionFunctions[action]}), {})

  const asyncActions = asyncActionsList.reduce((o, action) => ({ ...o, [mapActions[action]]: actionFunctions[action]}), {});
  const syncActions = syncActionsList.reduce((o, action) => ({ ...o, [mapActions[action]]: actionFunctions[action]}), {});
  
  const returnObj = {
    mapActions,
    actionsStripped: {
      ...asyncActionsStripped,
      ...syncActionsStripped,
      ...asyncActionsIncluded,
      ...syncActionsIncluded,
    },
    asyncActions,
    syncActions,
    asyncActionsStripped,
    syncActionsStripped,
    asyncActionsIncluded,
    syncActionsIncluded,
    actionTypes,
    actions: {
      ...asyncActions,
      ...syncActions,
      ...asyncActionsIncluded,
      ...syncActionsIncluded,
    },
  }

  
  const actionsList = asyncActionsList.concat(syncActionsList);
  
  // actionDispatchers and actionDispatchersStripped are created after the actionFunctions are created and returned to caller.
  // There, actionDispatchers of all factories are combined and can be obtained using:
  // getAllActionDispatchers(dispatch) to obtain the full name actions (e.g. getFooList) of all factories
  // getActionDispatchersStripped(dispatch) to obtain the stripped actions (getList) of only this factory
  const actionDispatchers = dispatch => Object.fromEntries(
    actionsList.map(action => [
      mapActions[action] || action,
      (...args) => dispatch(actionFunctions[action](...args)),
    ])
  );

  const allActionFunctions = { ...actionFunctions, ...asyncActionsIncluded, ...syncActionsIncluded };
  const actionDispatchersStripped = dispatch => Object.fromEntries(
    actionsList.map(action => [
      action,
      (...args) => dispatch(allActionFunctions[action](...args)),
    ])
  );

  return {
    ...returnObj,
    actionDispatchers,
    actionDispatchersStripped,
  };
};
