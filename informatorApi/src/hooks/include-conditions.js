// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const conditions = sequelize.models.conditions;
    context.params.sequelize = {
      include: [{ model: conditions }]
    };

    return context;
  };
};
