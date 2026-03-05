// Initializes the `mailer` service on path `/mailer`
const Mailer = require('feathers-mailer');
const hooks = require('./mailer.hooks');
const smtpTransport = require('nodemailer-smtp-transport');

module.exports = function (app) {
  /*     ssl: false,
    tls: true,
    auth: {
      user: "edcfd4a0eafbfb",
      pass: "69d21e4b7e2096" 
    }
      */
  // Initialize our service with any options it requires
  app.use(
    '/mailer',
    Mailer(
      smtpTransport({
        host: '10.100.12.41',
        port: 25
      })
    )
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('mailer');

  service.hooks(hooks);
};
