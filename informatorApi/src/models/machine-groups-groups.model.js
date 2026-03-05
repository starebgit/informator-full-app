// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const machineGroupsGroups = sequelizeClient.define(
    'machine_groups_groups',
    {
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      underscored: true,
      timestamps: false,
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  machineGroupsGroups.associate = function (models) {
    machineGroupsGroups.belongsTo(models.machine_groups);
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return machineGroupsGroups;
};
