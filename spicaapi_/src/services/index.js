const users = require('./users/users.service.js');
const employee = require('./employee/employee.service.js');
const events = require('./events/events.service.js');
const badges = require('./badges/badges.service.js');
const superiors = require('./superiors/superiors.service.js');
const dailyReport = require('./daily-report/daily-report.service.js');
const dailyEvents = require('./daily-events/daily-events.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(users);
  app.configure(employee);
  app.configure(events);
  app.configure(badges);
  app.configure(superiors);
  app.configure(dailyReport);
  app.configure(dailyEvents);
};
