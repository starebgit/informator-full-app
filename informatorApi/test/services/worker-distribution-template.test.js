const assert = require('assert');
const app = require('../../src/app');

describe('\'worker distribution template\' service', () => {
  it('registered the service', () => {
    const service = app.service('worker-distribution-template');

    assert.ok(service, 'Registered the service');
  });
});
