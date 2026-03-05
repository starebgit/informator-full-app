// Initializes the `digitalization` service on path `/digitalization`
const { Digitalization } = require('./digitalization.class');
const createModel = require('../../models/digitalization.model');
const hooks = require('./digitalization.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/digitalization', new Digitalization(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('digitalization');

  service.hooks(hooks);
};