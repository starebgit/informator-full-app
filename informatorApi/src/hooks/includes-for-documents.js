// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const uploads = sequelize.models.uploads;
    const categories = sequelize.models.categories;
    const users = sequelize.models.users;
    const subcategories = sequelize.models.subcategories;
    context.params.sequelize = {
      raw: false,
      include: [
        { model: categories },
        { model: uploads },
        {
          model: users,
          attributes: ['id', 'username', 'roleId', 'email', 'name', 'lastname']
        },
        { model: subcategories }
      ]
    };
    return context;
  };
};
