// Initializes the `auth managment` service on path `/auth-managment`
const authManagment = require('feathers-authentication-management');
const hooks = require('./auth-managment.hooks');
const notifier = require('./notifier');

module.exports = function (app) {
  // Initialize our service with any options it requires
  //app.use('/auth-managment', new AuthManagment(options, app));
  app.configure(authManagment(notifier(app)));
  // Get our initialized service so that we can register hooks
  const service = app.service('auth-managment');

  service.hooks(hooks);
};
