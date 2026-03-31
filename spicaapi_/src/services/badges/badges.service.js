// Initializes the `badges` service on path `/badges`
const { Badges } = require('./badges.class');
const createModel = require('../../models/badges.model');
const hooks = require('./badges.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/badges', new Badges(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('badges');

  service.hooks(hooks);
};
