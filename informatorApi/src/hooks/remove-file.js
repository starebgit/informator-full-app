// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const fs = require('fs');
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const upload = context.result;
    fs.unlink(upload.path, (err) => {
      if (err) {
        return;
      }
    });
    return context;
  };
};
