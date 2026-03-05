// Initializes the `keywords` service on path `/keywords`
const { Keywords } = require('./keywords.class');
const createModel = require('../../models/keywords.model');
const hooks = require('./keywords.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/keywords', new Keywords(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('keywords');

  service.hooks(hooks);
};
