const { authenticate } = require('@feathersjs/authentication').hooks;

const fileMap = require('../../hooks/file-map');

const removeFile = require('../../hooks/remove-file');

module.exports = {
  before: {
    all: [authenticate('jwt')],
    find: [],
    get: [],
    create: [fileMap()],
    update: [fileMap()],
    patch: [fileMap()],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [removeFile()]
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
