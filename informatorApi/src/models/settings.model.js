// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const settings = sequelizeClient.define(
    'settings',
    {
      description: {
        type: DataTypes.STRING,
        allowNull: false
      },
      constrained: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      dataType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      minValue: {
        type: DataTypes.STRING,
        allowNull: true
      },
      maxValue: {
        type: DataTypes.STRING,
        allowNull: true
      },
      defaultValue: {
        type: DataTypes.STRING,
        allowNull: null
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
  settings.associate = function (models) {
    //settings.hasMany(models.allowed_settings_value);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return settings;
};
