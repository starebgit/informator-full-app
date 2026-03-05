// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const uploads = sequelizeClient.define(
    'uploads',
    {
      description: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false
      },
      size: {
        type: DataTypes.INTEGER,
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
  uploads.associate = function (models) {
    uploads.belongsTo(models.users);
    uploads.belongsToMany(models.attachments, {
      through: 'attachments_uploads'
    });
    uploads.belongsToMany(models.documents, { through: 'documents_uploads' });
    uploads.belongsToMany(models.orders, {
      through: 'orders_uploads'
    });
    uploads.belongsToMany(models.notices, {
      through: 'notices_uploads'
    });
    uploads.belongsToMany(models.digitalization, {
      through: 'digitalization_uploads'
    });
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return uploads;
};
