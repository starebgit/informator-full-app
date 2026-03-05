// Initializes the `subcategories` service on path `/subcategories`
const { Subcategories } = require('./subcategories.class');
const createModel = require('../../models/subcategories.model');
const hooks = require('./subcategories.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/subcategories', new Subcategories(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('subcategories');

  service.hooks(hooks);
};
