// Initializes the `documents uploads` service on path `/documents-uploads`
const { DocumentsUploads } = require('./documents-uploads.class');
const hooks = require('./documents-uploads.hooks');

module.exports = function (app) {
  const options = {
    documents: app.service('documents'),
    uploads: app.service('uploads')
  };

  // Initialize our service with any options it requires
  app.use('/documents-uploads', new DocumentsUploads(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('documents-uploads');

  service.hooks(hooks);
};
