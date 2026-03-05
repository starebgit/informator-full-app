const includeConditions = require('../../hooks/include-conditions');

module.exports = {
  before: {
    all: [],
    find: [includeConditions()],
    get: [includeConditions()],
    create: [includeConditions()],
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
