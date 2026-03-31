const fetchSuperiors = require('../../hooks/fetch-superiors');

module.exports = {
  before: {
    all: [],
    find: [fetchSuperiors()],
    get: [fetchSuperiors()],
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
