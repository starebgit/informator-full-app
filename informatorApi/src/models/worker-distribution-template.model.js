// See https://sequelize.org/master/manual/model-basics.html
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const workerDistributionTemplate = sequelizeClient.define(
    'worker_distribution_template',
    {
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
  workerDistributionTemplate.associate = function (models) {
    workerDistributionTemplate.belongsTo(models.subunits);
    workerDistributionTemplate.belongsTo(models.users);
  };

  return workerDistributionTemplate;
};
