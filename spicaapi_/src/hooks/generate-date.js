// deploy test commit
// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const dayjs = require('dayjs');
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const result = context.result;
    context.result = result.map((row) => {
      return {
        date: dayjs(row.dateTime).format('YYYY-MM-DD'),
        ...row
      };
    });
    return context;
  };
};
