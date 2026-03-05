// Initializes the `notices keywords` service on path `/notices-keywords`
const { NoticesKeywords } = require('./notices-keywords.class');
const hooks = require('./notices-keywords.hooks');

module.exports = function (app) {
  const options = {
    notices: app.service('notices'),
    keywords: app.service('keywords')
  };

  // Initialize our service with any options it requires
  app.use('/notices-keywords', new NoticesKeywords(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('notices-keywords');

  service.hooks(hooks);
};
