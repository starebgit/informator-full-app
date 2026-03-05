// Initializes the `production data static` service on path `/production-data-static`
const { ProductionDataStatic } = require('./production-data-static.class');
const createModel = require('../../models/production-data-static.model');
const hooks = require('./production-data-static.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/production-data-static', new ProductionDataStatic(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('production-data-static');

  service.hooks(hooks);
};
