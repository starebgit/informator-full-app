const assert = require('assert');
const app = require('../../src/app');

describe("'groups static' service", () => {
  it('registered the service', () => {
    const service = app.service('groups-static');

    assert.ok(service, 'Registered the service');
  });
});
