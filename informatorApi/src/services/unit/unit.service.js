// Initializes the `unit` service on path `/unit`
const { Unit } = require('./unit.class');
const createModel = require('../../models/unit.model');
const hooks = require('./unit.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/units', new Unit(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('units');

  service.hooks(hooks);
};
