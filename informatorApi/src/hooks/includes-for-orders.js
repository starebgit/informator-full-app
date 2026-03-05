// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const parts = sequelize.models.parts;
    const operations = sequelize.models.operations;
    const machines = sequelize.models.operation_machines;
    const uploads = sequelize.models.uploads;

    context.params.sequelize = {
      include: [
        { model: parts },
        { model: operations, include: [{ model: machines }] },
        { model: uploads }
      ],
      raw: false,
      nest: true
    };
    return context;
  };
};
