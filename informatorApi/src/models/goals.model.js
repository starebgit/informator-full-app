const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const goals = sequelizeClient.define(
    'goals',
    {
      realizationGoal: {
        type: DataTypes.INTEGER
      },
      qualityGoal: {
        type: DataTypes.DECIMAL(3, 2)
      },
      oeeGoal: {
        type: DataTypes.DECIMAL(4, 1)
      },
      startDate: {
        type: DataTypes.DATE
      },
      endDate: {
        type: DataTypes.DATE
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

  goals.associate = function (models) {
    goals.belongsTo(models.machine_groups);
    goals.belongsTo(models.users);
  };

  return goals;
};
