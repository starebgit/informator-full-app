const assert = require('assert');
const app = require('../../src/app');

describe("'daily events' service", () => {
  it('registered the service', () => {
    const service = app.service('daily-events');

    assert.ok(service, 'Registered the service');
  });
});
