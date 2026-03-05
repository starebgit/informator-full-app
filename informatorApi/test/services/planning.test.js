const assert = require('assert');
const app = require('../../src/app');

describe("'planning' service", () => {
  it('registered the service', () => {
    const service = app.service('planning');

    assert.ok(service, 'Registered the service');
  });
});
