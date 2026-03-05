// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const subunits = sequelize.models.subunits;

    context.params.sequelize = {
      include: [{ model: subunits }],
      raw: false,
      nest: true
    };
    return context;
  };
};
