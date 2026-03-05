const assert = require('assert');
const app = require('../../src/app');

describe("'subcategories' service", () => {
  it('registered the service', () => {
    const service = app.service('subcategories');

    assert.ok(service, 'Registered the service');
  });
});
