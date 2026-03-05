// Initializes the `orders uploads` service on path `/orders-uploads`
const { OrdersUploads } = require('./orders-uploads.class');
const hooks = require('./orders-uploads.hooks');

module.exports = function (app) {
  const options = {
    orders: app.service('orders'),
    uploads: app.service('uploads')
  };

  // Initialize our service with any options it requires
  app.use('/orders-uploads', new OrdersUploads(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('orders-uploads');

  service.hooks(hooks);
};
