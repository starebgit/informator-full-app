const { Op } = require('sequelize');

module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const { params, method } = context;
    if (!context.params.sequelize) context.params.sequelize = {};
    Object.assign(context.params.sequelize, {
      include: [
        {
          model: sequelize.models.uploads
        },
        {
          model: sequelize.models.users,
          attributes: ['id', 'username', 'roleId', 'email', 'name', 'lastname']
        },
      ],
      nest: true,
      raw: false
    });
    return context;
  };
};
