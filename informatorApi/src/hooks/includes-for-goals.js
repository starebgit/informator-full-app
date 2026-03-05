// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const machine_group = sequelize.models.machine_groups;
    const users = sequelize.models.users;

    context.params.sequelize = {
      include: [
        { model: machine_group },
        {
          model: users,
          attributes: ['id', 'username', 'roleId', 'email', 'name', 'lastname']
        }
      ],
      raw: false,
      nest: true
    };
    return context;
  };
};
