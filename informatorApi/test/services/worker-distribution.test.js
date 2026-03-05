const assert = require('assert');
const app = require('../../src/app');

describe("'worker distribution' service", () => {
  it('registered the service', () => {
    const service = app.service('worker-distribution');

    assert.ok(service, 'Registered the service');
  });
});
