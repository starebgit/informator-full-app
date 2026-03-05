const includesForAccidents = require('../../hooks/includes-for-accidents');

const computeWeek = require('../../hooks/compute-week');

module.exports = {
  before: {
    all: [],
    find: [includesForAccidents()],
    get: [includesForAccidents()],
    create: [computeWeek()],
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
