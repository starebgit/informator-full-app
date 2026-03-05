// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const uploads = sequelize.models.uploads;
    const subunits = sequelize.models.subunits;
    const user = sequelize.models.users;
    const keywords = sequelize.models.keywords;
    context.params.sequelize = {
      include: [
        { model: uploads },
        { model: subunits },
        {
          model: user,
          attributes: ['id', 'username', 'roleId', 'email', 'name', 'lastname']
        },
        { model: keywords }
      ],
      nest: true,
      raw: false
    };
    return context;
  };
};
