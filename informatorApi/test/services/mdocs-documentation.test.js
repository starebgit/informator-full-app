const assert = require('assert');
const app = require('../../src/app');

describe('\'mdocs documentation\' service', () => {
  it('registered the service', () => {
    const service = app.service('mdocs-documentation');

    assert.ok(service, 'Registered the service');
  });
});
