// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

//TODO -add userId
module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const attachments = sequelizeClient.define(
    'attachments',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true
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
  attachments.associate = function (models) {
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
    attachments.belongsTo(models.subunits);
    attachments.belongsTo(models.users);
    attachments.belongsTo(models.categories);
    attachments.belongsToMany(models.uploads, {
      through: 'attachments_uploads'
    });
  };

  return attachments;
};
