const removeUpload = require('../../hooks/remove-upload');
const getDigitalization = require('../../hooks/get-digitalization');

module.exports = {
  before: {
    all: [getDigitalization()],
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