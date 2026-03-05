// Initializes the `goals` service on path `/goals`
const { Goals } = require('./goals.class');
const createModel = require('../../models/goals.model');
const hooks = require('./goals.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/goals', new Goals(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('goals');

  service.hooks(hooks);
};
