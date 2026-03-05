// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;
//TODO - add userId
module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const accidents = sequelizeClient.define(
    'accidents',
    {
      employeeId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      birthDate: {
        type: DataTypes.DATEONLY
      },
      accidentDate: {
        type: DataTypes.DATE
      },
      description: {
        type: DataTypes.TEXT
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
  accidents.associate = function (models) {
    accidents.belongsTo(models.accident_causes);
    accidents.belongsTo(models.subunits);
    accidents.belongsTo(models.users);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return accidents;
};
