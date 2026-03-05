const includesForDocuments = require('../../hooks/includes-for-documents');
const removeUpload = require('../../hooks/remove-upload');

module.exports = {
  before: {
    all: [includesForDocuments()],
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
