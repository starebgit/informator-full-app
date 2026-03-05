// Initializes the `machine-categories` service on path `/machine-categories`
const { MachineCategories } = require('./machine-categories.class');
const createModel = require('../../models/machine-categories.model');
const hooks = require('./machine-categories.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/machine-categories', new MachineCategories(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('machine-categories');

  service.hooks(hooks);
};
