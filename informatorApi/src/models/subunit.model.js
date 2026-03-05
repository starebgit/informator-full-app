// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const subunit = sequelizeClient.define(
    'subunits',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      keyword: {
        type: DataTypes.STRING,
        allowNull: false
      },
      ted: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      esfm: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    },
    {
      underscored: true,
      timestamps: false,
      hooks: {
        beforeCount(options) {
          //options.raw = true;
          options.nest = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  subunit.associate = function (models) {
    subunit.belongsTo(models.units);
    subunit.hasMany(models.accidents);
    subunit.hasMany(models.foremans);
    subunit.hasMany(models.machine_groups);
    subunit.hasMany(models.notices);
    subunit.hasMany(models.attachments);
    subunit.hasMany(models.documents);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return subunit;
};
