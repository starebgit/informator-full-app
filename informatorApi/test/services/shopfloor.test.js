const assert = require('assert');
const app = require('../../src/app');

describe("'shopfloor' service", () => {
  it('registered the service', () => {
    const service = app.service('shopfloor');

    assert.ok(service, 'Registered the service');
  });
});
