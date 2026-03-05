const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  development: {
    url: process.env.MSSQL,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: false,
        enableArithAbort: true
      }
    },
    migrationStorageTableName: '_migrations'
  }
};
