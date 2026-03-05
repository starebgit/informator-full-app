const assert = require('assert');
const app = require('../../src/app');

describe("'foremans' service", () => {
  it('registered the service', () => {
    const service = app.service('foremans');

    assert.ok(service, 'Registered the service');
  });
});
