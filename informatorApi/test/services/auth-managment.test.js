const assert = require('assert');
const app = require('../../src/app');

describe("'auth managment' service", () => {
  it('registered the service', () => {
    const service = app.service('auth-managment');

    assert.ok(service, 'Registered the service');
  });
});
