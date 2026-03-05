const includeSubunit = require('../../hooks/include-subunit');

module.exports = {
  before: {
    all: [],
    find: [includeSubunit()],
    get: [includeSubunit()],
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
