// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const operationMachines = sequelizeClient.define(
    'operation_machines',
    {
      machineKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      machineAltKey: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      underscored: true,
      timestamps: false,
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  operationMachines.associate = function (models) {
    operationMachines.belongsTo(models.operations);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return operationMachines;
};
