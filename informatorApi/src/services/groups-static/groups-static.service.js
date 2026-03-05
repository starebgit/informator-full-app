// Initializes the `groups static` service on path `/groups-static`
const { GroupsStatic } = require('./groups-static.class');
const createModel = require('../../models/groups-static.model');
const hooks = require('./groups-static.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/groups-static', new GroupsStatic(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('groups-static');

  service.hooks(hooks);
};
