const assert = require('assert');
const app = require('../../src/app');

describe("'orders uploads' service", () => {
  it('registered the service', () => {
    const service = app.service('orders-uploads');

    assert.ok(service, 'Registered the service');
  });
});
