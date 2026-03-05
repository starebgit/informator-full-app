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
          model: sequelize.models.subunits,
          attributes: ['id', 'name']
        },
        {
          model: sequelize.models.users,
          attributes: ['id', 'username', 'roleId', 'email', 'name', 'lastname']
        },
        {
          model: sequelize.models.keywords,
          attributes: ['id', 'keyword']
        }
      ],
      nest: true,
      raw: false
    });
    if (method == 'find') {
      const { keywordId } = params.query;
      if (keywordId) {
        delete params.query.keywordId;
        Object.assign(context.params.query, {
          id: {
            [Op.in]: sequelize.literal(
              `(SELECT notices.id FROM notices INNER JOIN notices_keywords ON notices.id = notices_keywords.notice_id WHERE notices_keywords.keyword_id = ${keywordId})`
            )
          }
        });
      }
    }
    return context;
  };
};
