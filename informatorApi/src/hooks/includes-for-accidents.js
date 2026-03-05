// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const causes = sequelize.models.accident_causes;
    const users = sequelize.models.users;
    const subunits = sequelize.models.subunits;

    context.params.sequelize = {
      include: [
        { model: causes, attributes: ['cause'] },
        { model: subunits },
        {
          model: users,
          attributes: ['id', 'username', 'roleId', 'email', 'name', 'lastname']
        }
      ],
      attributes: { exclude: ['cause_id'] },
      raw: false,
      nest: true
    };
    return context;
  };
};
