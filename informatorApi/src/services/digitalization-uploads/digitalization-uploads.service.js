const { DigitalizationUploads } = require('./digitalization-uploads.class');
const hooks = require('./digitalization-uploads.hooks');

module.exports = function (app) {
  const options = {
    digitalization: app.service('digitalization'),
    uploads: app.service('uploads')
  };

  app.use('/digitalization-uploads', new DigitalizationUploads(options, app));

  const service = app.service('digitalization-uploads');
  
  service.hooks(hooks);
};