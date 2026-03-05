// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const units = sequelize.models.units;

    context.params.sequelize = {
      include: [{ model: units }],
      raw: false,
      nest: true
    };
    return context;
  };
};
