const assert = require('assert');
const app = require('../../src/app');

describe("'superiors' service", () => {
  it('registered the service', () => {
    const service = app.service('superiors');

    assert.ok(service, 'Registered the service');
  });
});
