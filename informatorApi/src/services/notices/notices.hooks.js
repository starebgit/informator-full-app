const removeUpload = require('../../hooks/remove-upload');

const includesForNotices = require('../../hooks/includes-for-notices');
const getNotices = require('../../hooks/get-notices');

module.exports = {
  before: {
    all: [getNotices()],
    find: [],
    get: [],
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
    remove: [removeUpload()]
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
