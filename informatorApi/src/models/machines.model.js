// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const machines = sequelizeClient.define(
    'machines',
    {
      machineKey: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      machineAltKey: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      displayName: {
        type: DataTypes.STRING,
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
  machines.associate = function (models) {
    machines.belongsTo(models.machine_groups);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return machines;
};
