import Axios, { Method, AxiosRequestConfig } from 'axios';
import { ThunkDispatch } from 'redux-thunk';

import actionsFactory, { getDetailRoute } from './actionsFactory';
import reducerFactory from './reducerFactory';
import hooksFactory from './hooksFactory';
import mappersFactory from './mappersFactory';
import { toUpperCamelCase, singleToPlural } from './utils';

type Dispatch = ThunkDispatch<any, undefined, any>;

export type OnError = (error: any) => void;

export type DetailRoute = string | ((instance: any) => string);
export type Route = string | (() => string);

export type Prepare = () => any;
export type DetailPrepare = (instance: any) => any;
export type Callback = (data: any) => void;

type AsyncFunctions = {
  callback: Callback,
  onError: OnError,
}
export interface GetListConfig extends AsyncFunctions {
  method: Method;
  prepare: Prepare,
  route: Route;
}
export interface GetAllConfig extends AsyncFunctions {
  method: Method;
  prepare: Prepare | null,
  route: Route | null;
}
export interface CreateConfig extends AsyncFunctions {
  method: Method;
  prepare: Prepare | null,
  route: Route | null;
}
export interface GetConfig extends AsyncFunctions {
  method: Method;
  prepare: DetailPrepare | null,
  route: DetailRoute | null;
}
export interface UpdateConfig extends AsyncFunctions {
  method: Method;
  prepare: DetailPrepare | null,
  route: DetailRoute | null;
}
export interface DeleteConfig extends AsyncFunctions {
  method: Method;
  prepare: DetailPrepare | null,
  route: DetailRoute | null;
}

export type IncludeAction = {
  isAsync?: boolean;
  route: Route | DetailRoute;
  method: Method;
  prepare?: (instance: any) => any;
  onResponse?: (instance: any) => any;
  parent?: string;
  onError?: OnError;
  axiosConfig?: AxiosRequestConfig;
}

export type IncludeActions = {
  [action: string]: IncludeAction;
}

export type Actions = {
  get?: boolean | Partial<GetConfig>;
  getList?: boolean | Partial<GetListConfig>;
  getAll?: boolean | Partial<GetAllConfig>;
  create?: boolean | Partial<CreateConfig>;
  update?: boolean | Partial<UpdateConfig>;
  delete?: boolean | Partial<DeleteConfig>;
  select?: false | 'single' | 'multiple';
}

export type State = {
  [key: string]: any;
}

export type Config = {
  actions: Actions;
  id?: string;
  parseIdToInt?: boolean;
  byKey?: string;
  state?: State;
  parent?: string;
  parentId?: string;
  parseParentToInt?: boolean;
  recursive?: boolean;
  route?: Route;
  includeActions?: IncludeActions;
  axios?: typeof Axios;
  onError?: OnError;
  actionTypeStyle?: null;
};

export type DefaultConfig = { 
  axios: typeof Axios;
  onError: OnError;
  actions: Actions;
  id?: string;
  byKey?: string;
  parentId?: string;
  parseIdToInt?: boolean;
  parseParentToInt?: boolean;
};

export interface ReduxCrudFactoryProps extends DefaultConfig {
  config: {
    [objectName: string]: Config;
  };
}

export type ActionDispenser = (dispatch: Dispatch) => { 
  [func: string]: (...args: any[]) => void;
};
const validateConfig = (config: Config, defaultConfig: DefaultConfig) => {
  const {
    // The id to use when perform crud actions
    id = defaultConfig.id || 'id',
    parseIdToInt = defaultConfig.parseIdToInt || false,
    // The key to sort by in the state
    byKey = defaultConfig.byKey || null,
    state = {},
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
  
  let newConfig = {
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
    state,
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
          } as GetListConfig}
        : {},
      ...parent && actions.getAll
        ? { getAll: {
            method: 'get',
            prepare: null,
            callback: null,
            onError: null,
            route,
            ...typeof actions.getAll === 'object' ? actions.getAll : {},
          } as GetAllConfig}
        : {},
      ...actions.create
        ? { create: {
            method: 'post',
            prepare: null,
            callback: null,
            onError: null,
            route,
            ...typeof actions.create === 'object' ? actions.create : {},
          } as CreateConfig}
        : {},
      ...actions.get
        ? { get: {
            method: 'get',
            prepare: null,
            callback: null,
            onError: null,
            route: detailRoute,
            ...typeof actions.get === 'object' ? actions.get : {},
          } as GetConfig}
        : {},
      ...actions.update
        ? { update: {
            method: 'patch',
            prepare: null,
            callback: null,
            onError: null,
            route: detailRoute,
            ...typeof actions.update === 'object' ? actions.update : {},
          } as UpdateConfig}
        : {},
      ...actions.delete
        ? { delete: {
            method: 'delete',
            prepare: null,
            callback: null,
            onError: null,
            route: detailRoute,
            ...typeof actions.delete === 'object' ? actions.delete : {},
          } as DeleteConfig}
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
    includeActions: Object.entries(includeActions as IncludeActions)
      .reduce(
        (o, [key, { isAsync=true, method='get', ...obj}]) => (
          { ...o, [key]: { ...obj, isAsync, method }}
        ),
        {}
      ),
    route,
    selectedId: undefined as string | undefined,
    selectedIds: undefined as string | undefined,
  };
  if (newConfig.actions.select === 'single') {
    newConfig.selectedId = `selected${toUpperCamelCase(id)}`
  } else if (newConfig.actions.select === 'multiple') {
    newConfig.selectedIds = `selected${singleToPlural(toUpperCamelCase(id))}`
  }
  return newConfig;
}

type GetFactoryProps = {
  objectName: string;
  config: Config;
  defaultConfig: DefaultConfig;
  getAllActionDispatchers: (dispatch: Dispatch) => any;
  getActionDispatchersStripped: (objectName: string) => any;
}
const getFactory = ({
  objectName,
  config: cfg,
  defaultConfig,
  getAllActionDispatchers,
  getActionDispatchersStripped,
}: GetFactoryProps) => {
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
  ...defaultConfig
}: ReduxCrudFactoryProps) => {
  // Save all actionDispatchers in this array
  const allActionDispatchers = [] as ActionDispenser[];
  // Function to obtain actionDispatchers after they have all been created to avoid a chicken and egg situation because
  // the first factory actions requires the actions of all factories before those actions have been created.
  const getAllActionDispatchers = (dispatch: Dispatch) =>
    allActionDispatchers.reduce(
      (o, actionDispatcher) => ({ ...o, ...actionDispatcher(dispatch) }), {});
  // Same situation as getAllActionDispatchers: First generate actionDispatchersStripped for each objectName and supply a
  // function to fetch them
  const allActionDispatchersStripped = {} as {[objectName: string]: any};
  const getActionDispatchersStripped = (objectName: string) => allActionDispatchersStripped[objectName];
  
  const fullFactory = {} as {[property: string]: any};
  Object.entries(fullConfig)
    .map(([objectName, config]) => {
      const { actionDispatchers, actionDispatchersStripped, ...factory } = getFactory({
        objectName,
        config,
        defaultConfig,
        getAllActionDispatchers,
        getActionDispatchersStripped,
      });
      Object.entries(factory).map(([property, value]: [string, any]) => {
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
