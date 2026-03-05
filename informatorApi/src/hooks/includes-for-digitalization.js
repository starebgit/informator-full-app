// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const uploads = sequelize.models.uploads;
    const user = sequelize.models.users;
    context.params.sequelize = {
      include: [
        { model: uploads },
        {
          model: user,
          attributes: ['id', 'username', 'roleId', 'email', 'name', 'lastname']
        },
      ],
      nest: true,
      raw: false
    };
    return context;
  };
};
