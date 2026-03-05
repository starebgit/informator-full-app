// Initializes the `allowed settings value` service on path `/allowed-settings-value`
const { AllowedSettingsValue } = require('./allowed-settings-value.class');
const createModel = require('../../models/allowed-settings-value.model');
const hooks = require('./allowed-settings-value.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/allowed-settings-value', new AllowedSettingsValue(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('allowed-settings-value');

  service.hooks(hooks);
};
