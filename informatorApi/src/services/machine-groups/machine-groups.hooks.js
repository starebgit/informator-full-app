const includeMachines = require('../../hooks/include-machines');

const patchMachines = require('../../hooks/patch-machines');

module.exports = {
  before: {
    all: [],
    find: [includeMachines()],
    get: [includeMachines()],
    create: [includeMachines()],
    update: [],
    patch: [patchMachines()],
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
