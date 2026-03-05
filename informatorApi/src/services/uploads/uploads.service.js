// Initializes the `uploads` service on path `/uploads`
const { Uploads } = require('./uploads.class');
const createModel = require('../../models/uploads.model');
const hooks = require('./uploads.hooks');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}_${file.originalname.replace('%', '')}`)
});

const upload = multer({
  storage,
  limits: {
    fieldSize: 5e7,
    fileSize: 5e7
  }
});

module.exports = function (app) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  };

  // Initialize our service with any options it requires
  //app.use('/uploads', new Uploads(options, app));
  app.use(
    '/uploads',
    upload.array('files'),
    (req, _res, next) => {
      const { method } = req;
      if (method === 'POST' || method === 'PATCH') {
        req.feathers.files = req.files;
        next();
      }
    },
    new Uploads(options, app)
  );
  // Get our initialized service so that we can register hooks
  const service = app.service('uploads');

  service.hooks(hooks);
};
