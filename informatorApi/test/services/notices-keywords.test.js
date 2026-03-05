const assert = require('assert');
const app = require('../../src/app');

describe("'notices keywords' service", () => {
  it('registered the service', () => {
    const service = app.service('notices-keywords');

    assert.ok(service, 'Registered the service');
  });
});
