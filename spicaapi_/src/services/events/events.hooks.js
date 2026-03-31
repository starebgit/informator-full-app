const generateDate = require('../../hooks/generate-date');

const eventsCustomParams = require('../../hooks/events-custom-params');

module.exports = {
  before: {
    all: [],
    find: [eventsCustomParams()],
    get: [eventsCustomParams()],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [generateDate()],
    get: [generateDate()],
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
