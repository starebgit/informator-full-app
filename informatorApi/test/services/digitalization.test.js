const assert = require('assert');
const app = require('../../src/app');

describe("'digitalization' service", () => {
  it('registered the service', () => {
    const service = app.service('digitalization');

    assert.ok(service, 'Registered the service');
  });
});
