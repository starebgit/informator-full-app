// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const parts = sequelizeClient.define(
    'parts',
    {
      egoCode: {
        type: DataTypes.STRING,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      dimension: {
        type: DataTypes.STRING,
        allowNull: true
      },
      quantity: {
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
  parts.associate = function (models) {
    parts.belongsTo(models.orders);
  };

  return parts;
};
