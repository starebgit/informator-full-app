const assert = require('assert');
const app = require('../../src/app');

describe("'badges' service", () => {
  it('registered the service', () => {
    const service = app.service('badges');

    assert.ok(service, 'Registered the service');
  });
});
