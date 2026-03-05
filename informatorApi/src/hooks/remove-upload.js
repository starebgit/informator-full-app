// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const uploads = context.app.service('uploads');
    const uploadsArray = context.result.uploads;
    uploadsArray.forEach((upload) => {
      uploads.remove(upload.id);
    });
    return context;
  };
};
