// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const dayjs = require('dayjs');
const { INTEGER } = require('sequelize');
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

DataTypes.DATE.prototype._stringify = function _stringify(date, options) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss.SSS');
};

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const events = sequelizeClient.define(
    'events',
    {
      id: {
        field: 'NO',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      employeeId: {
        field: 'USERNO',
        type: DataTypes.INTEGER
      },
      dateTime: {
        field: 'DT',
        type: DataTypes.DATE
      },
      eventId: {
        field: 'EVENTID',
        type: DataTypes.INTEGER
      }
    },
    {
      timestamps: false,
      tableName: 'EVENTS',
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  events.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return events;
};
