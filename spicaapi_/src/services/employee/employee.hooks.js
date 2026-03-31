const includeEvents = require('../../hooks/include-events');

const employeeCustomParams = require('../../hooks/employee-custom-params');

module.exports = {
  before: {
    all: [],
    find: [employeeCustomParams()],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [includeEvents()],
    get: [includeEvents()],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
