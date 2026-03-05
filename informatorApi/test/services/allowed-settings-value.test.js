const assert = require('assert');
const app = require('../../src/app');

describe("'allowed settings value' service", () => {
  it('registered the service', () => {
    const service = app.service('allowed-settings-value');

    assert.ok(service, 'Registered the service');
  });
});
