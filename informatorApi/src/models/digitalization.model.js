// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const { DataTypes } = require('sequelize');
  const digitalization = sequelizeClient.define('digitalization', {
    title: { type: DataTypes.STRING, allowNull: false },
    startDate: { type: DataTypes.DATE, allowNull: true },
    endDate: { type: DataTypes.DATE, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true }
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
  
  digitalization.associate = function (models) {
    digitalization.belongsTo(models.users, { foreignKey: 'user_id' });
    digitalization.belongsToMany(models.uploads, {
      through: 'digitalization_uploads'
    });
  };

  return digitalization;
};
