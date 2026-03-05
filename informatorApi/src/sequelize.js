const Sequelize = require('sequelize');

module.exports = function (app) {
  const connectionString = app.get('mssql'); // 🟢 updated to 'mssql'
  const sequelize = new Sequelize(connectionString, {
    dialect: 'mssql', // 🟢 changed
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
    app.set('sequelizeSync', sequelize.sync());

    return result;
  };
};
