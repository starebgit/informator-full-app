// Initializes the `daily events` service on path `/daily-events`
const { DailyEvents } = require('./daily-events.class');
const hooks = require('./daily-events.hooks');

module.exports = function (app) {
  const options = {
    sequelize: app.get('sequelizeClient')
  };

  // Initialize our service with any options it requires
  app.use('/daily-events', new DailyEvents(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('daily-events');

  service.hooks(hooks);
};
