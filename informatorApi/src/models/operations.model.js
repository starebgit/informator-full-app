// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const operations = sequelizeClient.define(
    'operations',
    {
      sequence: {
        type: DataTypes.STRING,
        allowNull: true
      },
      label: {
        type: DataTypes.STRING,
        allowNull: true
      },
      operationKey: {
        field: 'operation_key',
        type: DataTypes.STRING,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      norm: { type: DataTypes.DECIMAL(7, 3) },
      confirmation: {
        type: DataTypes.STRING
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
  operations.associate = function (models) {
    operations.belongsTo(models.orders);
    operations.hasMany(models.operation_machines);
  };

  return operations;
};
