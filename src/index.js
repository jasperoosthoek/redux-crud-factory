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
            route,
            ...typeof actions.getList === 'object' ? actions.getList : {},
          }}
        : {},
      ...parent && actions.getAll
        ? { getAll: {
            method: 'get',
            prepare: null,
            route,
            ...typeof actions.getAll === 'object' ? actions.getAll : {},
          }}
        : {},
      ...actions.create
        ? { create: {
            method: 'post',
            prepare: null,
            route,
            ...typeof actions.create === 'object' ? actions.create : {},
          }}
        : {},
      ...actions.get
        ? { get: {
            method: 'get',
            prepare: null,
            route: detailRoute,
            ...typeof actions.get === 'object' ? actions.get : {},
          }}
        : {},
      ...actions.update
        ? { update: {
            method: 'patch',
            prepare: null,
            route: detailRoute,
            ...typeof actions.update === 'object' ? actions.update : {},
          }}
        : {},
      ...actions.delete
        ? { delete: {
            method: 'delete',
            prepare: null,
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
    includeActions,
    route,
  };
  if (newConfig.actions.select === 'single') {
    newConfig.selectedId = `selected${toUpperCamelCase(id)}`
  }
  return newConfig;
}

const getFactory = ({ objectName, config: cfg, defaultConfig, getAllActionDispatchers }) => {
  const config = validateConfig(cfg, defaultConfig);
  // Reuse actionTypes as there is no reason to create them twice
  const at = actionTypes(objectName, config);
  return {
    actionTypes: at,
    ...actionsFactory({ objectName, config, getAllActionDispatchers }),
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
  connect,
}) => {
  // Save all actionDispatchers in this array
  const allActionDispatchers = [];
  // Function to obtain actionDispatchers after they have all been created to avoid a chicken and egg situation because
  // the first factory requires the actions of all factories before those actions have been created.
  const getAllActionDispatchers = dispatch =>
    allActionDispatchers.reduce((o, actionDispatcher) => ({ ...o, ...actionDispatcher(dispatch) }), {});
  
  const fullFactory = {};
  Object.entries(fullConfig)
    .map(([objectName, config]) => {
      const { actionDispatchers, ...factory } = getFactory({
        objectName,
        config,
        defaultConfig: { 
          axios,
          connect,
          onError,
          actions,
          id,
          byKey,
          parentId,
        },
        getAllActionDispatchers,
      });
      Object.entries(factory).map(([property, value]) => {
        fullFactory[property] = {
          ...fullFactory[property] ? fullFactory[property] : {},
          [objectName]: value,
        }
      })

      allActionDispatchers.push(actionDispatchers);
      return [objectName, factory]
    });
  
  fullFactory.connect = (connect, mapStateToProps, mapDispatchToProps, mergeProps, options) => component => {
      console.log({ mapStateToProps, mapDispatchToProps, mergeProps, options })
      // console.log({ factoryNames, mapStateToProps, mapDispatchToProps, mergeProps, options })
      return connect(
        mapStateToProps,
        // (state, ownProps) => ({
        //   ...mapStateToProps ? mapStateToProps(state, ownProps) : {},
        // }),
        mapDispatchToProps,
        // {
        //   ...mapDispatchToProps ? mapDispatchToProps : {},
        // },
      mergeProps,
      options
    )(component)}
  return fullFactory;
}
