// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const notices = sequelizeClient.define(
    'notices',
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      materialCode: {
        type: DataTypes.STRING,
        allowNull: true
      },
      machineCode: {
        type: DataTypes.STRING,
        allowNull: true
      },
      formCode: {
        type: DataTypes.STRING,
        allowNull: true
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false
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
  notices.associate = function (models) {
    notices.belongsTo(models.notice_types);
    notices.belongsTo(models.subunits);
    notices.belongsTo(models.users);
    notices.belongsToMany(models.uploads, {
      through: 'notices_uploads'
    });
    notices.belongsToMany(models.keywords, {
      through: 'notices_keywords'
    });
  };

  return notices;
};
