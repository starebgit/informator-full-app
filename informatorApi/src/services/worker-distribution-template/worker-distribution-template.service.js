// Initializes the `worker distribution template` service on path `/worker-distribution-template`
const { WorkerDistributionTemplate } = require('./worker-distribution-template.class');
const createModel = require('../../models/worker-distribution-template.model');
const hooks = require('./worker-distribution-template.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/worker-distribution-template', new WorkerDistributionTemplate(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('worker-distribution-template');

  service.hooks(hooks);
};
