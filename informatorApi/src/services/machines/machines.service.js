// Initializes the `machines` service on path `/machines`
const { Machines } = require('./machines.class');
const createModel = require('../../models/machines.model');
const hooks = require('./machines.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/machines', new Machines(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('machines');

  service.hooks(hooks);
};
