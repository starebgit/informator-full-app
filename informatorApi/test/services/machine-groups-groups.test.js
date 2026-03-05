const assert = require('assert');
const app = require('../../src/app');

describe("'machine groups groups' service", () => {
  it('registered the service', () => {
    const service = app.service('machine-groups-groups');

    assert.ok(service, 'Registered the service');
  });
});
