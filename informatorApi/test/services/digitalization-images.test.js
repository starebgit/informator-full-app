const assert = require('assert');
const app = require('../../src/app');

describe("'digitalization images' service", () => {
  it('registered the service', () => {
    const service = app.service('digitalization-images');

    assert.ok(service, 'Registered the service');
  });
});
