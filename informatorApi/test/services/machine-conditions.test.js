const assert = require('assert');
const app = require('../../src/app');

describe("'machine conditions' service", () => {
  it('registered the service', () => {
    const service = app.service('machine-conditions');

    assert.ok(service, 'Registered the service');
  });
});
