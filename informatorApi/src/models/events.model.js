// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeStaticClient');
  const events = sequelizeClient.define(
    'events',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      events: {
        type: DataTypes.STRING,
        allowNull: false
      },
      unitId: {
        type: DataTypes.INTEGER,
        allowNUll: false
      },
      unitTitle: {
        type: DataTypes.STRING,
        allowNUll: false
      },
      foreman: {
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
  events.associate = function (models) {};

  return events;
};
