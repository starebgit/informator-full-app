// Initializes the `operations` service on path `/operations`
const { Operations } = require('./operations.class');
const createModel = require('../../models/operations.model');
const hooks = require('./operations.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/operations', new Operations(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('operations');

  service.hooks(hooks);
};
