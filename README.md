# Redux Crud Factory

Redux Crud Factory is a declarative toolkit that allows for creating [`CRUD`](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (create, read, update, and delete) actions that allow a [`React`](https://www.npmjs.com/package/react) app to interact with a backend `api`. State management is handled by [`Redux`](https://www.npmjs.com/package/redux) using [`Redux Thunk`](https://www.npmjs.com/package/redux-thunk) middleware. The api calls are performed using [`Axios`](https://www.npmjs.com/package/axios). The backend can be as simple as an `api` based on a [`ViewSet`](https://www.django-rest-framework.org/api-guide/viewsets/) using the [`Django Rest Framework`](https://www.django-rest-framework.org/#example).

The simplest full `CRUD` can be created like this:
```javascript
import reduxCrudFactory from 'redux-crud-factory';
import axios from 'axios';

// Our object name must be camelCase
const objectName = 'farmAnimals';
const config = {
    route: 'https://example.com/api/farm-animals/', // Non-existing route!
    axios,
    actions: {
        getList: true,
        create: true,
        update: true,
        delete: true,
    },
};

export const farmAnimalsFactory = reduxCrudFactory(
    objectName,
    config
);

// Show what we got in the console
console.log(farmAnimalsFactory);
```

The object `farmAnimalsFactory` contains the following components:

- `actionTypes`: All the Redux action types, for instance `{ getList: 'GET_FARM_ANIMALS_LIST', create: 'CREATE_FARM_ANIMAL', ... }`. Note that name `farmAnimals` is used to create human readable Redux action types. Single/plural is automatically handled including words like category/categories.
- `actions`: All available functions that can trigger Redux actions with formatted names: `{ getFarmAnimalsList: ƒ, createFarmAnimal: ƒ, updateFarmAnimal: ƒ, ... }`.
- `actionsStripped`: Same as `actions` above but with stripped down names: `{ getList: ƒ, create: ƒ, update: ƒ, ... }`.
- `mapStateToProps`: The function that gets data from the store into our React component: `{ farmAnimalsList: { ... }, farmAnimalsIsLoading: false, farmAnimalsHasErrored: false, ... }`. The formatted lis
- `mapStateToPropsStripped`:  Same as `mapStateToProps` however with stripped down names: `{ list: { ... }, getListIsLoading: false, getListHasErrored: false, ... }`.
- `reducer`: The Redux reducer function that will handle state management
- `reducerAsObject`:  The same Redux reducer function supplied as `{ farmAnimals: ƒ }`. This object can be easily used with `combineReducers()` from Redux (see example below) and leads to a *single source of truth* for the object name.
- `config`: The same `config` object as supplied however it contained all available options.

Now connect to the redux store:
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
        ...farmAnimalsFactory.reducerAsObject,
        // The above is identical to:
        // farmAnimals: farmAnimalsFactory.reducer,

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

Here the data will be saved in the redux store like this `{ farmAnimals: { ... } }`. An `axios` instance is required and needs to be supplied.

In the simple example above the specification for a complete `CRUD` are created. The api response is assumed to be:
```javascript
[
    {
        id: 1,
        type: 'cow',
        name: 'Bertha'
    },
    {
        id: 2,
        type: 'goat',
        name: 'Billy'
    }
]
```

The objects are saved in the redux store as:
```javascript
{
    farmAnimals: {
        list: {
            1: {
                id: 1,
                type: 'cow',
                name: 'Bertha',
            },
            2: {
                id: 2,
                type: 'goat',
                name: 'Billy',
            },
        },
        createHasErrored: false,
        createIsLoading: false,
        deleteHasErrored: false,
        deleteIsLoading: false,
        getListHasErrored: false,
        getListIsLoading: false,
        updateHasErrored: false,
        updateIsLoading: false
    },
}
```

Note that the list object is **not** an array but a key/value pair based on the `id` even though the `api` returns a list. Of course this `id` field can be modified.

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
    farmAnimalsFactory.mapStateToProps,
    farmAnimalsFactory.actions
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
