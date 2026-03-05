// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const accidentCauses = sequelizeClient.define(
    'accident_causes',
    {
      cause: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      timestamps: false,
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  accidentCauses.associate = function (models) {
    accidentCauses.hasMany(models.accidents);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return accidentCauses;
};
