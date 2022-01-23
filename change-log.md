
##### Version 0.0.18

- Split `reducerFactory` and move `mapToProps` function to `mappersFactory`
- Cleaning up state: prevent actions from other reducers to create initial state or garbage in state

##### Version 0.0.19
- Custom Axios request config `axiosConfig` can be added when calling any action (e.g. `createFoo(obj, { axiosConfig: { timeout: 2000 } })` ): https://axios-http.com/docs/req_config
- The `config.actions` object has default { method: ..., route: ..., prepare: ... } for each action.
- Each action has a configurable route string or function, prepare function and axios method
- actionDispatchers have stripped (create, getList etc.) as well as full function names (createFoo, getFooList etc.)
- Breaking change: includeActions only allows extra arguments to be passed in `args` key: `extraAction(obj, { args: { extra: 'argument' }})`.