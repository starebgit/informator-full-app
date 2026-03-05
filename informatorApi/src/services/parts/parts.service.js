// Initializes the `parts` service on path `/parts`
const { Parts } = require('./parts.class');
const createModel = require('../../models/parts.model');
const hooks = require('./parts.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  };

  // Initialize our service with any options it requires
  app.use('/parts', new Parts(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('parts');

  service.hooks(hooks);
};
