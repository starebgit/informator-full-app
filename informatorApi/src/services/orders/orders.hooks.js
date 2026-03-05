const includesForOrder = require('../../hooks/includes-for-orders');

module.exports = {
  before: {
    all: [],
    find: [includesForOrder()],
    get: [includesForOrder()],
    create: [includesForOrder()],
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
