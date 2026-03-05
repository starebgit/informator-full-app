// Initializes the `machine groups groups` service on path `/machine-groups-groups`
const { MachineGroupsGroups } = require('./machine-groups-groups.class');
const createModel = require('../../models/machine-groups-groups.model');
const hooks = require('./machine-groups-groups.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/machine-groups-groups', new MachineGroupsGroups(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('machine-groups-groups');

  service.hooks(hooks);
};
