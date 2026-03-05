const { Op } = require('sequelize');
// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const foremans = sequelize.models.foremans;

    context.params.sequelize = {
      //Nested Eager loading
      include: [
        { model: foremans }
        /* {
          model: subunits,
          nesting: true,
          attributes: { exclude: ["unit_id"] },
          include: { model: units },
        }, */
      ],
      raw: false,
      nest: true
    };

    const { subunitId } = context.params.query;

    if (subunitId) {
      delete context.params.query.subunitId;
      Object.assign(context.params.query, {
        id: {
          [Op.in]: sequelize.literal(
            `(SELECT s.id from staff s INNER JOIN foremans f ON f.id = s.foreman_id WHERE f.subunit_id = ${subunitId})`
          )
        }
      });
    }
    return context;
  };
};
