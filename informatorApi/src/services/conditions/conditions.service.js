// Initializes the `conditions` service on path `/conditions`
const { Conditions } = require('./conditions.class');
const createModel = require('../../models/conditions.model');
const hooks = require('./conditions.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/conditions', new Conditions(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('conditions');

  service.hooks(hooks);
};
