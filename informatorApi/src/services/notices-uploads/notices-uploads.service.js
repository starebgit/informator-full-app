// Initializes the `notices uploads` service on path `/notices-uploads`
const { NoticesUploads } = require('./notices-uploads.class');
const hooks = require('./notices-uploads.hooks');

module.exports = function (app) {
  const options = {
    notices: app.service('notices'),
    uploads: app.service('uploads')
  };

  // Initialize our service with any options it requires
  app.use('/notices-uploads', new NoticesUploads(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('notices-uploads');

  service.hooks(hooks);
};
