const assert = require('assert');
const app = require('../../src/app');

describe("'notice types' service", () => {
  it('registered the service', () => {
    const service = app.service('notice-types');

    assert.ok(service, 'Registered the service');
  });
});
