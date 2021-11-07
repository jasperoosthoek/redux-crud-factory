import actionsFactory, { actionTypes } from './actionsFactory';
import reducerFactory, { mapToProps } from './reducerFactory';
import { toUpperCamelCase } from './utils';

const validateConfig = ({
  id = 'id',
  byKey = null,
  includeProps = null,
  parent = null,
  route = null,
  actions = null,
  includeActions = {},
  axios = null,
  onError = null,
  actionTypeStyle = null,
}) => {
  const defaultActions = {
    get: true,
    getList: true,
    create: true,
    update: true,
    delete: true,
    select: 'single',
  };
  const newConfig = {
    id,
    byKey: byKey ? byKey : id,
    parent,
    includeProps,
    axios,
    onError,
    actionTypeStyle,
    actions: {
      ...!actions
        ? defaultActions
        :
          {
            get: !!actions.get,
            getList: !!actions.getList,
            create: !!actions.create,
            update: !!actions.update,
            delete: !!actions.delete,
          },
        ...!actions || !actions.select
          ? {}
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

export default (camelCaseName, cfg) => {
  const config = validateConfig(cfg);
  // Reuse actionTypes as there is no reason to create them twice
  const at = actionTypes(camelCaseName, config);;
  return {
    actionTypes: at,
    ...actionsFactory(camelCaseName, config),
    ...reducerFactory(camelCaseName, config, at),
    // Export either mapStateToProps when parent is falsy or mapStateAndOwnPropsToProps when parent is a string
    ...mapToProps(camelCaseName, config),
    config,
  };
}
