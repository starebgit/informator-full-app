// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const orders = sequelizeClient.define(
    'orders',
    {
      materialCode: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dimension: {
        type: DataTypes.STRING,
        allowNull: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      code: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      scheduledEnddate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    },
    {
      underscored: true
    },
    {
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  orders.associate = function (models) {
    orders.hasMany(models.parts);
    orders.hasMany(models.operations);
    orders.belongsToMany(models.uploads, {
      through: 'orders_uploads'
    });
  };

  return orders;
};
