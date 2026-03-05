const parseExcel = require('../../hooks/parse-excel');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [parseExcel()],
    update: [parseExcel()],
    patch: [parseExcel()],
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
