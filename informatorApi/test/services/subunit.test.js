const assert = require('assert');
const app = require('../../src/app');

describe("'subunit' service", () => {
  it('registered the service', () => {
    const service = app.service('subunit');

    assert.ok(service, 'Registered the service');
  });
});
