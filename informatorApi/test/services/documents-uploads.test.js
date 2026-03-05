const assert = require('assert');
const app = require('../../src/app');

describe("'documents-uploads' service", () => {
  it('registered the service', () => {
    const service = app.service('documents-uploads');

    assert.ok(service, 'Registered the service');
  });
});
