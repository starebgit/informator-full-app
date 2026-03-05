// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeStaticClient');
  const productionDataStatic = sequelizeClient.define(
    'production_data_static',
    {
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      total: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      good: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      bad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      underscored: true,
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  productionDataStatic.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    productionDataStatic.belongsTo(models.groups_static);
  };

  return productionDataStatic;
};
