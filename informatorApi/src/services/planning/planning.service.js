// Initializes the `planning` service on path `/planning`
const { Planning } = require('./planning.class');
const hooks = require('./planning.hooks');

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/planning', new Planning(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('planning');

  service.hooks(hooks);
};
