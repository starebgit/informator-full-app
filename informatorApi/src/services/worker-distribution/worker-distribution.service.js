// Initializes the `worker distribution` service on path `/worker-distribution`
const { WorkerDistribution } = require('./worker-distribution.class');
const createModel = require('../../models/worker-distribution.model');
const hooks = require('./worker-distribution.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/worker-distribution', new WorkerDistribution(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('worker-distribution');

  service.hooks(hooks);
};
