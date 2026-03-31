const assert = require('assert');
const app = require('../../src/app');

describe("'employee' service", () => {
  it('registered the service', () => {
    const service = app.service('employee');

    assert.ok(service, 'Registered the service');
  });
});
