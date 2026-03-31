const assert = require('assert');
const app = require('../../src/app');

describe("'daily report' service", () => {
  it('registered the service', () => {
    const service = app.service('daily-report');

    assert.ok(service, 'Registered the service');
  });
});
