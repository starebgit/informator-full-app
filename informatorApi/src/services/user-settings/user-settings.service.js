// Initializes the `user settings` service on path `/user-settings`
const { UserSettings } = require('./user-settings.class');
const createModel = require('../../models/user-settings.model');
const hooks = require('./user-settings.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: ['patch']
  };

  // Initialize our service with any options it requires
  app.use('/user-settings', new UserSettings(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('user-settings');

  service.hooks(hooks);
};
