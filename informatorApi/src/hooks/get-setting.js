// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const { merged, ...query } = context.params.query;
    if (merged) {
      await sequelize
        .query(
          `select
            US.id as id,
            S1.description as description,
            S1.data_type as dataType,
            S1.constrained,
            case when S1.constrained = 1 then AV.item_value else US.unconstrained_value end value,
            AV.caption as caption
          from user_settings US
          inner join settings S1 on US.setting_id = S1.id 
          left outer join allowed_settings_value AV on US.allowed_settings_value_id = AV.id
          where US.user_id = :id`,
          {
            raw: true,
            replacements: { id: query.id }
          }
        )
        .then((response) => {
          const [output] = response;
          const result = {};
          output.map(({ description, ...rest }) => {
            result[description] = { ...rest };
          });
          context.params.query = query;
          context.result = result;
          return context;
        });
    }
    return context;
  };
};
