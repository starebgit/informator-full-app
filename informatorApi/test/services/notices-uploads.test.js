const assert = require('assert');
const app = require('../../src/app');

describe("'notices uploads' service", () => {
  it('registered the service', () => {
    const service = app.service('notices-uploads');

    assert.ok(service, 'Registered the service');
  });
});
