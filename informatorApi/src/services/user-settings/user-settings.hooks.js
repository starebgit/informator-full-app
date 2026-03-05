const { authenticate } = require('@feathersjs/authentication').hooks;

const includesForUserSettings = require('../../hooks/includes-for-user-settings');

const getSetting = require('../../hooks/get-setting');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [getSetting()],
    get: [getSetting()],
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
