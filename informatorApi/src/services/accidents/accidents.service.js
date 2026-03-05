// Initializes the `accidents` service on path `/accidents`
const { Accidents } = require('./accidents.class');
const createModel = require('../../models/accidents.model');
const hooks = require('./accidents.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/accidents', new Accidents(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('accidents');

  service.hooks(hooks);
};
