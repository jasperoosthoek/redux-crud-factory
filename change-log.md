
##### Version 0.0.18
- Split `reducerFactory` and move `mapToProps` function to `mappersFactory`
- Cleaning up state: prevent actions from other reducers to create initial state or garbage in state

##### Version 0.0.19
- Custom Axios request config `axiosConfig` can be added when calling any action (e.g. `createFoo(obj, { axiosConfig: { timeout: 2000 } })` ): https://axios-http.com/docs/req_config
- The `config.actions` object has default { method: ..., route: ..., prepare: ... } for each action.
- Each action has a configurable route string or function, prepare function and axios method
- actionDispatchers have stripped (create, getList etc.) as well as full function names (createFoo, getFooList etc.)
- **Breaking change**: includeActions only allows extra arguments to be passed in `args` key: `extraAction(obj, { args: { extra: 'argument' }})`.

##### Version 0.1.0
- **Breaking change**: Multiple configurations are combined to a single configuration
- Callbacks object with dispatchable action functions of all configurations as second argument

##### Version 0.1.1
- **Breaking change**: Call with reduxCrudFactory({ config: ... }) instead of reduxCrudFactory( ... ) to allow for more fields
- Add default config fields: reduxCrudFactory({ config, axios, id, onError, actions, connect }) that are merged with factory config
- Correctly handle update action when object key (byKey !== id) changes or when parent key changes.
- Fix not mapping objects to props when id !== byKey
- Always give 2 arguments to callback instead of 3 (combine second and third argument)
- All callbacks now get async redux actions as well allowing a callback or onResponse to trigger another api call.

##### Version 0.1.2
- Each action function now has a `callback` and `onError` function
- Make `onResponse` function for custom actions optional

##### Version 0.1.3
- Fix: getList actions not triggering getListIsLoading redux action

##### Version 0.1.4
- **Breaking change**: Default/initial list object in state is now `null` instead of `{}` to differentiate between *not ready* and *no data* respectively

##### Version 0.1.5
- Fix: Delete action in reducer messes up state

##### Version 0.1.6
- Give first argument of `includeAction` as `obj` argument to `onResponse` function

##### Version 0.1.7
- Reset selected value for single selection when setting list when it is selected in the previous state but it no longer exists in the new state

##### Version 0.1.8
- Fix setting object getAll reducer when list === null in initial state 