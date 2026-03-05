const assert = require('assert');
const app = require('../../src/app');

describe("'machine-categories' service", () => {
  it('registered the service', () => {
    const service = app.service('machine-categories');

    assert.ok(service, 'Registered the service');
  });
});
