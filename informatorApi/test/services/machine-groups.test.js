const assert = require('assert');
const app = require('../../src/app');

describe("'machine-groups' service", () => {
  it('registered the service', () => {
    const service = app.service('machine-groups');

    assert.ok(service, 'Registered the service');
  });
});
