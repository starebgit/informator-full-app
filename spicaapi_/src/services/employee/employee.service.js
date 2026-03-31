// Initializes the `employee` service on path `/employee`
const { Employee } = require('./employee.class');
const createModel = require('../../models/employee.model');
const hooks = require('./employee.hooks');

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/employee', new Employee(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('employee');

  service.hooks(hooks);
};
