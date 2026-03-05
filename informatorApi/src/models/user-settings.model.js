// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const userSettings = sequelizeClient.define(
    'user_settings',
    {
      unconstrainedValue: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      timestamps: false,
      underscored: true,
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  userSettings.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    userSettings.belongsTo(models.settings);
    userSettings.belongsTo(models.users);
    userSettings.belongsTo(models.allowed_settings_value, {
      allowNull: true
    });
  };

  return userSettings;
};
