const assert = require('assert');
const app = require('../../src/app');

describe("'accident-causes' service", () => {
  it('registered the service', () => {
    const service = app.service('accident-causes');

    assert.ok(service, 'Registered the service');
  });
});
