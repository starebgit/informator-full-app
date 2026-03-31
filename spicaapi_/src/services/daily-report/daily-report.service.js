const { DailyReport } = require('../daily-report/daily-report.class');
const hooks = require('./daily-report.hooks');

module.exports = async function (app) {
  const options = {
    sequelize: app.get('sequelizeClient'),
    app: app
  };

  // Initialize our service with any options it requires
  app.use('/daily-report', new DailyReport(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('daily-report');

  service.hooks(hooks);
};
