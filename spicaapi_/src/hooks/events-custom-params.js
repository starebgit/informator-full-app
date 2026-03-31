// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const { dailyReport, ...query } = context.params.query;
    if (dailyReport && !query.dateTime) {
      throw new Error('If using dailyReport option dateTime must be set.');
    }
    context.params.dailyReport = dailyReport;
    context.params.query = query;
    return context;
  };
};
