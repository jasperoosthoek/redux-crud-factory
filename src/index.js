import actionsFactory, { actionTypes } from './actionsFactory';
import reducerFactory, { mapToProps } from './reducerFactory';
import { toUpperCamelCase } from './utils';

const validateConfig = ({
  id = 'id',
  byKey = null,
  includeProps = null,
  parent = null,
  parentId = 'id',
  recursive = false,
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
  if (recursive && !parent) {
    console.error('The option "recursive" is only valid when "parent" is set.')
  }
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
      ...!actions
        ? defaultActions
        : {
            get: !!actions.get,
            getList: !!actions.getList,
            create: !!actions.create,
            update: !!actions.update,
            delete: !!actions.delete,
          },
        ...!actions || !actions.select
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
