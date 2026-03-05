// Initializes the `foremans` service on path `/foremans`
const { Foremans } = require('./foremans.class');
const createModel = require('../../models/foremans.model');
const hooks = require('./foremans.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/foremans', new Foremans(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('foremans');

  service.hooks(hooks);
};
