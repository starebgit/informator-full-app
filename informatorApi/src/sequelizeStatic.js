const SequelizeStatic = require('sequelize');

module.exports = function (app) {
  const connectionString = app.get('mssql_static'); // 🟢 updated
  const sequelize = new SequelizeStatic(connectionString, {
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

  app.set('sequelizeStaticClient', sequelize);

  app.setup = function (...args) {
    const result = oldSetup.apply(this, args);

    const models = sequelize.models;
    Object.keys(models).forEach((name) => {
      if ('associate' in models[name]) {
        models[name].associate(models);
      }
    });

    app.set('sequelizeSync', sequelize.sync()); // this is okay if you only sync one

    return result;
  };
};
