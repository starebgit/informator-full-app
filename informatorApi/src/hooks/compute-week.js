// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

const dayjs = require('dayjs');
const weekOfYear = require('dayjs/plugin/weekOfYear');

dayjs.extend(weekOfYear);

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const data = { ...context.data };
    const accidentDate = data.accidentDate;
    context.data = { ...data, week: dayjs(accidentDate, 'YYYY-MM-DD').week() };
    return context;
  };
};
