const assert = require('assert');
const app = require('../../src/app');

describe("'conditions' service", () => {
  it('registered the service', () => {
    const service = app.service('conditions');

    assert.ok(service, 'Registered the service');
  });
});
