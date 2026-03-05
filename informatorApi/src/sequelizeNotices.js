const SequelizeNotices = require('sequelize');

module.exports = function (app) {
  const connectionString = app.get('mssql_notices'); // 🟢 updated
  const sequelize = new SequelizeNotices(connectionString, {
    dialect: 'mssql', // 🟢 updated
    logging: false,
    define: {
      freezeTableName: true
    },
    dialectOptions: {
      options: {
        encrypt: false,
        enableArithAbort: true
      }
    }
  });

  const oldSetup = app.setup;

  app.set('sequelizeNoticesClient', sequelize);

  app.setup = function (...args) {
    const result = oldSetup.apply(this, args);

    const models = sequelize.models;
    Object.keys(models).forEach((name) => {
      if ('associate' in models[name]) {
        models[name].associate(models);
      }
    });

    return result;
  };
};
