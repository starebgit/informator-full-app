// Initializes the `superiors` service on path `/superiors`
const { Superiors } = require('./superiors.class');
const createModel = require('../../models/superiors.model');
const hooks = require('./superiors.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/superiors', new Superiors(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('superiors');

  service.hooks(hooks);
};
