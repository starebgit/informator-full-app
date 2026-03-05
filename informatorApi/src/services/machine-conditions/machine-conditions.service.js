// Initializes the `machine conditions` service on path `/machine-conditions`
const { MachineConditions } = require('./machine-conditions.class');
const createModel = require('../../models/machine-conditions.model');
const hooks = require('./machine-conditions.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/machine-conditions', new MachineConditions(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('machine-conditions');

  service.hooks(hooks);
};
