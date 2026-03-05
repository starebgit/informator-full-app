// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const machineCategories = sequelizeClient.define(
    'machine_categories',
    {
      material: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.BOOLEAN,
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
  machineCategories.associate = function (models) {
    machineCategories.belongsTo(models.machine_groups);
  };

  return machineCategories;
};
