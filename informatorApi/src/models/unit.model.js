// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const unit = sequelizeClient.define(
    'units',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      sfm: {
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
          //options.nest = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  unit.associate = function (models) {
    unit.hasMany(models.subunits);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return unit;
};
