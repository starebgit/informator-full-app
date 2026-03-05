// Initializes the `notice types` service on path `/notice-types`
const { NoticeTypes } = require('./notice-types.class');
const createModel = require('../../models/notice-types.model');
const hooks = require('./notice-types.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/notice-types', new NoticeTypes(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('notice-types');

  service.hooks(hooks);
};
