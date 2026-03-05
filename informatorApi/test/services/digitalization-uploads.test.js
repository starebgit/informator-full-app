const assert = require('assert');
const app = require('../../src/app');

describe("'digitalization uploads' service", () => {
  it('registered the service', () => {
    const service = app.service('digitalization-uploads');

    assert.ok(service, 'Registered the service');
  });
});