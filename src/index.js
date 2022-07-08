import actionsFactory, { getDetailRoute } from './actionsFactory';
import reducerFactory from './reducerFactory';
import hooksFactory from './hooksFactory';
import mappersFactory from './mappersFactory';
import { toUpperCamelCase, singleToPlural, titleCase } from './utils';


const validateConfig = (config, defaultConfig) => {
  const {
    // The id to use when perform crud actions
    id = defaultConfig.id || 'id',
    parseIdToInt = defaultConfig.parseIdToInt || false,
    // The key to sort by in the state
    byKey = defaultConfig.byKey || null,
    includeState = {},
    parent = null,
    parentId = defaultConfig.parentId || 'id',
    parseParentToInt = defaultConfig.parseParentToInt || false,
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
    ? {
        get: true,
        getList: true,
        create: true,
        update: true,
        delete: true,
        select: false,
        ...parent ? { getAll: true } : {},
      }
    : {
      ...defaultConfig.actions ? defaultConfig.actions : {},
      ...config.actions ? config.actions : {},
    };

  if (!parent) {
    if (recursive) {
      console.error('ReduxCrudFactory: The option "recursive" is only valid when "parent" is set.');
    }
  }
  
  const detailRoute = getDetailRoute(route, id);
  
  const newConfig = {
    id,
    byKey: byKey ? byKey : id,
    parseIdToInt,
    parent,
    ...parent
      ? {
          parentId,
          recursive,
          parseParentToInt,
        }
      : {},
    includeState,
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
    newConfig.selectedId = `selected${titleCase(id)}`
  } else if (newConfig.actions.select === 'multiple') {
    newConfig.selectedIds = `selected${titleCase(singleToPlural(id))}`
  }
  console.log(toUpperCamelCase(singleToPlural(id)))
  return newConfig;
}

const getFactory = ({ objectName, config: cfg, defaultConfig, getAllActionDispatchers, getActionDispatchersStripped }) => {
  const config = validateConfig(cfg, defaultConfig);
  let factory = {
    ...actionsFactory({ objectName, config, getAllActionDispatchers, getActionDispatchersStripped }),
    config,
  };
  factory = {
    ...factory,
    ...mappersFactory(objectName, config, factory),
  }
  return {
    ...factory,
    ...hooksFactory(objectName, config, factory),
    ...reducerFactory(objectName, config, factory),
  }
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
