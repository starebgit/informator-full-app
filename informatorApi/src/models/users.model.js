// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;
const JsonField = require('sequelize-json');

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const users = sequelizeClient.define(
    'users',
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastname: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isVerified: {
        type: DataTypes.BOOLEAN
      },
      verifyExpires: {
        type: DataTypes.DATE
      },
      verifyToken: {
        type: DataTypes.STRING
      },
      verifyShortToken: {
        type: DataTypes.STRING
      },
      verifyChanges: JsonField(sequelizeClient, 'users', 'verifyChanges'),
      resetExpires: {
        type: DataTypes.DATE
      },
      resetToken: {
        type: DataTypes.STRING
      },
      resetShortToken: {
        type: DataTypes.STRING
      },
      resetAttempts: {
        type: DataTypes.INTEGER
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
  users.associate = function (models) {
    users.belongsTo(models.roles);
    users.hasMany(models.accidents);
    users.hasMany(models.machine_groups);
    users.hasMany(models.uploads);
    users.hasMany(models.goals);
    users.hasMany(models.attachments);
    users.hasMany(models.documents);
    users.hasMany(models.notices);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return users;
};
