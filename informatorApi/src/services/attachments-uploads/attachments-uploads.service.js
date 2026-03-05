// Initializes the `attachments uploads` service on path `/attachments-uploads`
const { AttachmentsUploads } = require('./attachments-uploads.class');
const hooks = require('./attachments-uploads.hooks');

module.exports = function (app) {
  const options = {
    attachments: app.service('attachments'),
    uploads: app.service('uploads')
  };

  // Initialize our service with any options it requires
  app.use('/attachments-uploads', new AttachmentsUploads(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('attachments-uploads');

  service.hooks(hooks);
};
