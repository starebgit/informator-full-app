const includesForGoals = require('../../hooks/includes-for-goals');

module.exports = {
  before: {
    all: [],
    find: [includesForGoals()],
    get: [includesForGoals()],
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
