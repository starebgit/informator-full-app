// Initializes the `machine-groups` service on path `/machine-groups`
const { MachineGroups } = require('./machine-groups.class');
const createModel = require('../../models/machine-groups.model');
const hooks = require('./machine-groups.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/machine-groups', new MachineGroups(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('machine-groups');

  service.hooks(hooks);
};
