// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const staff = sequelizeClient.define(
    'staff',
    {
      date: {
        type: DataTypes.DATEONLY
      },
      employeeId: {
        type: DataTypes.TEXT
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
  staff.associate = function (models) {
    staff.belongsTo(models.foremans);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return staff;
};
