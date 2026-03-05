const assert = require('assert');
const app = require('../../src/app');

describe("'notice images' service", () => {
  it('registered the service', () => {
    const service = app.service('notice-images');

    assert.ok(service, 'Registered the service');
  });
});
