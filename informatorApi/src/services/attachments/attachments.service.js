// Initializes the `attachments` service on path `/attachments`
const { Attachments } = require('./attachments.class');
const createModel = require('../../models/attachments.model');
const hooks = require('./attachments.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/attachments', new Attachments(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('attachments');

  service.hooks(hooks);
};
