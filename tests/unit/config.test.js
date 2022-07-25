// import * as axios from 'axios';
import axios from 'axios';

import reduxCrudFactory from '../../src/index';

// Mock out all top level functions, such as get, put, delete and post:
jest.mock('axios');

const factory = reduxCrudFactory({
  axios,
  onError: console.log,
  parseIdToInt: true,
  config: {
    users: {
      route: '/api/users/',
    },
    fooCategories: {
      route: () => '/api/categories',
      actions: {
        getList: true,
        update: {
          route: obj => `/api/something-else/${obj.id}/update`,
        }
      }
    }
  },
});
console.log(expect, factory);
// test('factory keys', () => {
//   expect(1 + 2).toBe(3);
// });

test('factory keys', () => {
  // Test using Set so order is not taken into account
  expect(new Set(Object.keys(factory))).toMatchObject(new Set([
    'mapActions',
    'asyncActions',
    'syncActions',
    'actionsStripped',
    'asyncActionsStripped',
    'syncActionsStripped',
    'asyncActionsIncludedActions',
    'syncActionsIncludedActions',
    'syncActionsIncludedState',
    'actionTypes',
    'actions',
    'config',
    'mapToProps',
    'mapToPropsStripped',
    'hooks',
    'hooksStripped',
    'reducers',
  ]));
});

