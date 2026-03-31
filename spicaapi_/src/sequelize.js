const Sequelize = require('sequelize');

module.exports = function (app) {
  const db = app.get('db');
  const usr = app.get('usr');
  const pass = app.get('pass');
  const sequelize = new Sequelize(db, usr, pass, {
    host: '172.20.11.156',
    dialect: 'mssql',
    dialectOptions: {
      options: {
        port: 1433,
        encrypt: false,
        requestTimeout: 300000
      }
    },
    define: {
      freezeTableName: true
    }
  });
  const oldSetup = app.setup;

  app.set('sequelizeClient', sequelize);

  app.setup = function (...args) {
    const result = oldSetup.apply(this, args);

    // Set up data relationships
    const models = sequelize.models;
    Object.keys(models).forEach((name) => {
      if ('associate' in models[name]) {
        models[name].associate(models);
      }
    });

    // Sync to the database
    //app.set('sequelizeSync', sequelize.sync());

    return result;
  };
};
