const includeForemans = require('../../hooks/include-foremans');

module.exports = {
  before: {
    all: [],
    find: [includeForemans()],
    get: [includeForemans()],
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
