// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const badges = sequelizeClient.define(
    'badges',
    {
      BDGNO: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      }
    },
    {
      timestamps: false,
      tableName: 'USER_BADGES',
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  badges.associate = function (models) {
    badges.belongsTo(models.employee, { foreignKey: 'USERNO' });
  };

  return badges;
};
