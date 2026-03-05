// Initializes the `accident-causes` service on path `/accident-causes`
const { AccidentCauses } = require('./accident-causes.class');
const createModel = require('../../models/accident-causes.model');
const hooks = require('./accident-causes.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/accident-causes', new AccidentCauses(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('accident-causes');

  service.hooks(hooks);
};
