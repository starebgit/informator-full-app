const includesForBadges = require('../../hooks/includes-for-badges');

module.exports = {
  before: {
    all: [],
    find: [includesForBadges()],
    get: [includesForBadges()],
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
