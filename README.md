### Deprecation notice 

This module is **no longer** actively developed as many design choices were made that made it very difficult to maintain. Most importantly: it proved to be impossible to rewrite to Typescript. Therefore it was first completely rewritten and later ported to use Zustand instead of Redux which dramatically reduced code complexity without compromising on functionality or performance. The rewritten module is called [`@jasperoosthoek/zustand-crud-registry`](https://github.com/jasperoosthoek/zustand-crud-registry).

The new module uses the same `config` concept to manage multiple *CRUDs* in React, however it only supports modern hooks. It abandones the `defaultConfig` concept (i.e. 2 config objects that are merged) and functions aren't automatically named. State updates are no longer defined in the config object, which caused *circular* typescript relations, but in custom hooks where types are known. The new module doesn't provide functionality for the `select` and `parent` configuration of `Redux Crud Factory` which might, or might not be included in the future.

# Redux Crud Factory

Redux Crud Factory is a declarative toolkit that allows for creating [`CRUD`](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (create, read, update, and delete) actions that allow a [`React`](https://www.npmjs.com/package/react) app to interact with a backend `api`. State management is handled by [`Redux`](https://www.npmjs.com/package/redux) using [`Redux Thunk`](https://www.npmjs.com/package/redux-thunk) middleware. The api calls are performed using [`Axios`](https://www.npmjs.com/package/axios). The backend can be as simple as an `api` based on a [`ViewSet`](https://www.django-rest-framework.org/api-guide/viewsets/) using the [`Django Rest Framework`](https://www.django-rest-framework.org/#example).

### Features
* Request a list of objects from the backend, create a new object, modify or delete an existing object in the list. Either one of these operations automatically modify the state (redux store) and the components will be updated.
* Allow for nested state: Imagine `books` are ordered by `author` and `books` received from the backend have an `author` key. By supplying a `parent = 'author'`  option in the `config` to `books`, all `book` objects received from the backend will be assumed to have this `parent` key and are ordered by the value of the objects `parent` key in the state. This creates multiple separated states for each value of `parent` (i.e. for each author). By supplying the `parent` as a prop to a component, either as an id or an object, this component will receive the parents child state: `<BooksList author="Stephen King" />`.
* Select single object (think radio box) or multiple objects (think check box): The list of objects, either with or without parents, can be selected by adding a `select = 'single'` or `select = 'multiple'` option to `config.actions`.

### The simplest full `CRUD` can be created like this
```javascript
import reduxCrudFactory from 'redux-crud-factory';
import axios from 'axios';

// Our object name 'farmAnimals' must be camelCase
export const factory = reduxCrudFactory({
  axios,
  config: {
  farmAnimals: {
    route: 'https://example.com/api/farm-animals',
    actions: {
      create: true,       // createFarmAnimal(obj) will perform post request to https://example.com/api/farm-animals
      get: true,          // getFarmAnimal(42) will perform get request to https://example.com/api/farm-animals/42
      getList: true,      // getFarmAnimalsList() will perform get request to https://example.com/api/farm-animals
      update: true,       // updateFarmAnimal(obj) will perform patch request to https://example.com/api/farm-animals/42
      delete: true,       // deleteFarmAnimal(obj) will perform delete request to https://example.com/api/farm-animals/42
    },
  },
   },
});
```

Or generate more elaborate cruds with many bells and whistles

```javascript
import reduxCrudFactory from 'redux-crud-factory';
import axios from 'axios';
import otherAxios from './OtherAxios';

// Our object name 'farmAnimals' must be camelCase
export const factory = reduxCrudFactory({
  axios: axios.create({                   // Default axios instance that is used for each factory in the config object
    baseURL: 'https://example.com'
  }),
  onError: console.error,                 // Log errors to console or use react-toastify
  actions: {                              // Default actions for all the factories
    get: true,
    getList: true,
    create: true,
    update: true,
    delete: true,
  },
  config: {
    farmAnimals: {
      route: '/api/farm-animals/',          // Trailing slash here
      actions: { get: true },               // Duplicate get action as it is already available, can be removed
    },
    plants: {
      route: '/api/plants',                 // No trailing slash on this route
      actions: { delete: false },           // Add or disable actions if you like to don't repeat yourself
      axios: otherAxios,                    // Maybe this route needs authentication

      includeActions: {                     // Create custom actions!
        sellPlant: {                          // The following functions are now generated: getPlant, getPlantsList, createPlant, updatePlant & sellPlant
                    
          method: 'post',                     // Any http method required
          
          route: ({ id }) =>                  // route can be string or function called when you call sellPlant(plant, { args: { your stuff.. }, params ))
          `/api/plants/${id}/sell`,           // Request params are handled automatically, args can be used in route, prepare or onResponse
          
          prepare: (plant, { args, params } =>      // Do something with additional args or params before data is sent to api
          ({ ...plant }), 
                                // Handle response.data from api. 
          onResponse: (plant, { updatePlant, getFarmAnimalsList, params, args }) =>
          {
            updatePlant(plant);             // All redux actions are available here. Update the plant in the state
            getFarmAnimalsList({            // Also request farmAnimals based on this plant id. State update will be automatic as
            params: plant: plant.id,        // getFarmAnimalsList() is a standard action
            });
          },
          },
        },
      },
    },
  },
});

```
Show what we got in the console
```
> console.log(factory)

{
  actionTypes: {farmAnimals: {…}, plantsAndVegetables: {…}},
  actions: {farmAnimals: {…}, plantsAndVegetables: {…}},
  actionsStripped: {farmAnimals: {…}, plantsAndVegetables: {…}},
  mapToProps: {farmAnimals: ƒ, plantsAndVegetables: ƒ},
  mapToPropsStripped: {farmAnimals: ƒ, plantsAndVegetables: ƒ},
  reducers: {farmAnimals: ƒ, plantsAndVegetables: ƒ},
  config: {farmAnimals: {…}, plantsAndVegetables: {…}},
}
```

### The object `factory` contains the following components

##### `actionTypes`:
> All the Redux action types, for instance `{ getList: 'GET_FARM_ANIMALS_LIST', create: 'CREATE_FARM_ANIMAL', ... }`. Note that name `farmAnimals` is used to create human readable Redux action types. Single/plural is automatically handled including words like category/categories.
##### `actions`: 
> All available functions that can trigger Redux actions with formatted names: `{ getFarmAnimalsList: ƒ, createFarmAnimal: ƒ, updateFarmAnimal: ƒ, ... }`.
##### `actionsStripped`: 
> Same as `actions` above but with stripped down names: `{ getList: ƒ, create: ƒ, update: ƒ, ... }`.
##### `mapToProps`: 
> The functions that gets data from the store into our React component: `{ farmAnimalsList: { ... }, farmAnimalsIsLoading: false, farmAnimalsHasErrored: false, ... }`. The formatted lis
##### `mapToPropsStripped`: 
>  Same as `mapStateToProps` however with stripped down names: `{ list: { ... }, getListIsLoading: false, getListHasErrored: false, ... }`.
##### `reducers`: 
> The Redux reducer function that will handle state managementfarmAnimals: ƒ }`. This object can be easily used with `combineReducers` from Redux (see example below) and leads to a *single source of truth* for the object name: `combineReducers({ ...factory.reducers, other: otherReducer })`
##### `config`: 
> The same `config` object as supplied however expanded with all the available options.

### Connect to the redux store
```javascript
import { Provider } from 'react-redux';
import { applyMiddleware, createStore, combineReducers } from 'redux';
// Redux thunk is required middleware
import thunk from 'redux-thunk';

// Log each redux action without changing the state. Not required but this allows us to see what's going on under the hood.
const consoleLogReducer = (state = null, { type, ...action }) => {
  console.log(type, action, state);
  return state;
}

const rootReducer = (state, action) => consoleLogReducer(
  combineReducers({
    ...factory.reducers
    // Add more reducers here...
  })(state, action),
  action
);

// The `Root` component used in our React App.
const Root = ({ children, initialState = {} }) => {
  const middleware = [thunk];

  const store = createStore(
    rootReducer(,
    initialState,
    applyMiddleware(...middleware)
  );

  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};
```

### Receive data from an api
Here the data will be saved in the redux store like this `{ farmAnimals: { ... } }`. An `axios` instance is required and needs to be supplied.

In the simple example above the specification for a complete `CRUD` are created. The api response is assumed to be:
```javascript
[
  {
    id: 1,
    type: 'donkey',
    name: 'Benjamin'
  },
  {
    id: 2,
    type: 'goat',
    name: 'Muriel'
  }
]
```

### Objects in the redux store

```javascript
{
  farmAnimals: {
    list: {
      1: {
        id: 1,
        type: 'donkey',
        name: 'Benjamin',
      },
      2: {
        id: 2,
        type: 'goat',
        name: 'Muriel',
      },
    },
    createError: null,
    createIsLoading: false,
    deleteError: null,
    deleteIsLoading: false,
    getListError: null,
    getListIsLoading: false,
    updateError: null,
    updateIsLoading: false
  },
}
```

Note that the list object is **not** an array but a key/value pair based on the `id` even though the `api` returns a list. Of course this `id` field can be modified.

### Get data to components
Now we can get the data and Redux functions in our component (`FarmAnimalsList.js`).
```javascript
// import farmAnimalsFactory from ...
import { Component } from 'react';
import { connect } from 'react-redux';

// Feel free to use functional components instead.
class FarmAnimalsList extends Component {
  componentDidMount() {
    this.props.getFarmAnimalsList();
  }

  render() {
    const { getFarmAnimalsIsLoading, farmAnimalsList, createFarmAnimal } = this.props;
    
    if (getFarmAnimalsIsLoading || !farmAnimalsList) return 'Loading farm animals...';
    
    return <ul>
      {Object.values(farmAnimalsList).map((farmAnimal, key) =>
        <li key={key}>
          The {farmAnimal.type} is called {farmAnimal.name} 
        </li>
      )}
    </ul>;
  }
};

export default connect(
  factory.mapToProps.farmAnimals,
  factory.actions.farmAnimals
)(FarmAnimalsList);
```
and

```javascript
import React, { Component } from 'react';
import FarmAnimalsList from './FarmAnimals';

class App extends Component {
  render() {
    return (
      <Root>
        <FarmAnimalsList />
      </Root>
    );
  }
}

export default App;
```
