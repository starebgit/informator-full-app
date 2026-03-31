// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    await sequelize
      .query(
        "SELECT DISTINCT SUBDEPARTMENT FROM [TSSPICA].[dbo].[USERS] WHERE DIVISION = 'ETA';",
        { raw: true, type: sequelize.QueryTypes.SELECT }
      )
      .then((result) => (context.result = result));
    return context;
  };
};
