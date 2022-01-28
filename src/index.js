import actionsFactory, { actionTypes, getDetailRoute } from './actionsFactory';
import reducerFactory from './reducerFactory';
import { getMapToProps } from './mappersFactory';
import { toUpperCamelCase } from './utils';

const defaultActions = {
  get: true,
  getList: true,
  create: true,
  update: true,
  delete: true,
  select: 'single',
};

const validateConfig = (config, defaultConfig) => {
  const {
    // The id to use when perform crud actions
    id = defaultConfig.id || 'id',
    // The key to sort by in the state
    byKey = defaultConfig.byKey || null,
    includeProps = null,
    parent = null,
    parentId = defaultConfig.parentId || 'id',
    recursive = false,
    route = null,
    includeActions = {},
    axios = defaultConfig.axios || null,
    onError = defaultConfig.onError || null,
    actionTypeStyle = null,
  } = config;

  // Merge default actions with actions for this factory
  const actions =
    !config.actions && !defaultConfig.actions
    ? defaultActions
    : {
      ...defaultConfig.actions ? defaultConfig.actions : {},
      ...config.actions ? config.actions : {},
    };

  if (recursive && !parent) {
    throw 'ReduxCrudFactory: The option "recursive" is only valid when "parent" is set.';
  }
  
  const detailRoute = getDetailRoute(route, id);
  
  const newConfig = {
    id,
    byKey: byKey ? byKey : id,
    parent,
    ...parent
      ? {
            parentId,
            recursive,
        }
      : {},
    includeProps,
    axios,
    onError,
    actionTypeStyle,
    actions: {
      ...actions.getList
        ? { getList: {
            method: 'get',
            prepare: null,
            callback: null,
            onError: null,
            route,
            ...typeof actions.getList === 'object' ? actions.getList : {},
          }}
        : {},
      ...parent && actions.getAll
        ? { getAll: {
            method: 'get',
            prepare: null,
            callback: null,
            onError: null,
            route,
            ...typeof actions.getAll === 'object' ? actions.getAll : {},
          }}
        : {},
      ...actions.create
        ? { create: {
            method: 'post',
            prepare: null,
            callback: null,
            onError: null,
            route,
            ...typeof actions.create === 'object' ? actions.create : {},
          }}
        : {},
      ...actions.get
        ? { get: {
            method: 'get',
            prepare: null,
            callback: null,
            onError: null,
            route: detailRoute,
            ...typeof actions.get === 'object' ? actions.get : {},
          }}
        : {},
      ...actions.update
        ? { update: {
            method: 'patch',
            prepare: null,
            callback: null,
            onError: null,
            route: detailRoute,
            ...typeof actions.update === 'object' ? actions.update : {},
          }}
        : {},
      ...actions.delete
        ? { delete: {
            method: 'delete',
            prepare: null,
            callback: null,
            onError: null,
            route: detailRoute,
            ...typeof actions.delete === 'object' ? actions.delete : {},
          }}
        : {},
      ...!actions.select
        ? { select: false }
        : actions.select === 'multiple'
          ? {
              select: 'multiple',
            }
          : {
              select: 'single',
            },
    },
    includeActions: Object.entries(includeActions)
      .reduce(
        (o, [key, { isAsync=true, method='get', ...obj}]) => (
          { ...o, [key]: { ...obj, isAsync, method }}
        ),
        {}
      ),
    route,
  };
  if (newConfig.actions.select === 'single') {
    newConfig.selectedId = `selected${toUpperCamelCase(id)}`
  }
  return newConfig;
}

const getFactory = ({ objectName, config: cfg, defaultConfig, getAllActionDispatchers, getActionDispatchersStripped }) => {
  const config = validateConfig(cfg, defaultConfig);
  // Reuse actionTypes as there is no reason to create them twice
  const at = actionTypes(objectName, config);
  return {
    actionTypes: at,
    ...actionsFactory({ objectName, config, getAllActionDispatchers, getActionDispatchersStripped }),
    reducers: reducerFactory(objectName, config, at),
    ...getMapToProps(objectName, config),
    config,
  };
}

export default ({
  config: fullConfig,
  axios,
  onError,
  actions,
  id,
  byKey,
  parentId,
}) => {
  // Save all actionDispatchers in this array
  const allActionDispatchers = [];
  // Function to obtain actionDispatchers after they have all been created to avoid a chicken and egg situation because
  // the first factory actions requires the actions of all factories before those actions have been created.
  const getAllActionDispatchers = dispatch =>
    allActionDispatchers.reduce((o, actionDispatcher) => ({ ...o, ...actionDispatcher(dispatch) }), {});
  // Same situation as getAllActionDispatchers: First generate actionDispatchersStripped for each objectName and supply a
  // function to fetch them
  const allActionDispatchersStripped = {};
    const getActionDispatchersStripped = objectName => allActionDispatchersStripped[objectName];
  
  const fullFactory = {};
  Object.entries(fullConfig)
    .map(([objectName, config]) => {
      const { actionDispatchers, actionDispatchersStripped, ...factory } = getFactory({
        objectName,
        config,
        defaultConfig: { 
          axios,
          onError,
          actions,
          id,
          byKey,
          parentId,
        },
        getAllActionDispatchers,
        getActionDispatchersStripped,
      });
      Object.entries(factory).map(([property, value]) => {
        fullFactory[property] = {
          ...fullFactory[property] ? fullFactory[property] : {},
          [objectName]: value,
        }
      })

      allActionDispatchers.push(actionDispatchers);
      allActionDispatchersStripped[objectName] = actionDispatchersStripped;
      return [objectName, factory]
    });
  
  return fullFactory;
}
