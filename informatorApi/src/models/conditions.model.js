// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const conditions = sequelizeClient.define(
    'conditions',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dataField: {
        type: DataTypes.STRING,
        allowNull: false
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
  conditions.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    conditions.hasMany(models.machine_conditions);
  };

  return conditions;
};
