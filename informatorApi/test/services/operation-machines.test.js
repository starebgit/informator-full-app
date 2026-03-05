const assert = require('assert');
const app = require('../../src/app');

describe("'operation machines' service", () => {
  it('registered the service', () => {
    const service = app.service('operation-machines');

    assert.ok(service, 'Registered the service');
  });
});
