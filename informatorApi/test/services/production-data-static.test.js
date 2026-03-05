const assert = require('assert');
const app = require('../../src/app');

describe("'production data static' service", () => {
  it('registered the service', () => {
    const service = app.service('production-data-static');

    assert.ok(service, 'Registered the service');
  });
});
