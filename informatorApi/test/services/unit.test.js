const assert = require('assert');
const app = require('../../src/app');

describe("'unit' service", () => {
  it('registered the service', () => {
    const service = app.service('unit');

    assert.ok(service, 'Registered the service');
  });
});
