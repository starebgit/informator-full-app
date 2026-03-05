// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const foremans = sequelizeClient.define(
    'foremans',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      spicaId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false
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
  foremans.associate = function (models) {
    foremans.belongsTo(models.subunits);
    foremans.hasMany(models.staff);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return foremans;
};
