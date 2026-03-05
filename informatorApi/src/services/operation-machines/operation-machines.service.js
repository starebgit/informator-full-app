// Initializes the `operation machines` service on path `/operation-machines`
const { OperationMachines } = require('./operation-machines.class');
const createModel = require('../../models/operation-machines.model');
const hooks = require('./operation-machines.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/operation-machines', new OperationMachines(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('operation-machines');

  service.hooks(hooks);
};
