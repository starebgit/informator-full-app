const fetchExcel = require('../../hooks/fetch-excel');

module.exports = {
  before: {
    all: [],
    find: [fetchExcel()],
    get: [fetchExcel()],
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
