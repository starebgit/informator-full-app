// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const workerDistribution = sequelizeClient.define(
    'worker_distribution',
    {
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      distribution: {
        type: DataTypes.TEXT,
        allowNull: false
      }
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
  workerDistribution.associate = function (models) {
    workerDistribution.belongsTo(models.subunits);
    workerDistribution.belongsTo(models.users);
  };

  return workerDistribution;
};
