const includeUnit = require('../../hooks/include-unit');

module.exports = {
  before: {
    all: [],
    find: [includeUnit()],
    get: [includeUnit()],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
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
