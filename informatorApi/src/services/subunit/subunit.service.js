// Initializes the `subunit` service on path `/subunit`
const { Subunit } = require('./subunit.class');
const createModel = require('../../models/subunit.model');
const hooks = require('./subunit.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/subunits', new Subunit(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('subunits');

  service.hooks(hooks);
};
