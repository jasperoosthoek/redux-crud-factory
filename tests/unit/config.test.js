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
  },
});
console.log(expect)
test('Dummy', () => {
  expect(1 + 2).toBe(3);
});

