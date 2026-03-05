const assert = require('assert');
const app = require('../../src/app');

describe("'upload excel' service", () => {
  it('registered the service', () => {
    const service = app.service('upload-excel');

    assert.ok(service, 'Registered the service');
  });
});
