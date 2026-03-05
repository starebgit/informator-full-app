const includesForAttachments = require('../../hooks/includes-for-attachments');
const removeUpload = require('../../hooks/remove-upload');

module.exports = {
  before: {
    all: [includesForAttachments()],
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
