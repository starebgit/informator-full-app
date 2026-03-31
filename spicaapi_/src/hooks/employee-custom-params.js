// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const { includeAvailability, startDate, endDate, ...query } =
      context.params.query;
    if (includeAvailability) {
      if (!startDate || !endDate) {
        throw new Error(
          "If using 'includeAvailability' option startDate and endDate must be set."
        );
      }
    }
    context.params.availability = {
      includeAvailability,
      startDate,
      endDate
    };

    context.params.query = query;
    return context;
  };
};
