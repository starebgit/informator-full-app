// Initializes the `upload excel` service on path `/upload-excel`
const { UploadExcel } = require('./upload-excel.class');
const hooks = require('./upload-excel.hooks');
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fieldSize: 1e7,
    fileSize: 1e7
  }
});

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use(
    '/upload-excel',
    upload.array('files'),
    (req, _res, next) => {
      const { method } = req;
      if (method === 'POST' || method === 'PATCH') {
        req.feathers.files = req.files;
        next();
      }
    },
    new UploadExcel(options, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service('upload-excel');

  service.hooks(hooks);
};
