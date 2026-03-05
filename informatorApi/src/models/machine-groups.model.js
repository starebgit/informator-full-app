// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const machineGroups = sequelizeClient.define(
    'machine_groups',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      quality: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      realization: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      oee: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      dashboard: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      qualityTol: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false
      },
      realizationTol: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false
      },
      oeeTol: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false
      },
      perShift: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      perMachine: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      perBuyer: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      perProduct: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      defaultValueCategory: {
        type: DataTypes.STRING,
        allowNull: false
      },
      static: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      hourly: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      norm: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
  machineGroups.associate = function (models) {
    machineGroups.hasMany(models.goals);
    machineGroups.hasMany(models.machines);
    machineGroups.hasMany(models.machine_categories, {
      as: 'machineCategories'
    });
    machineGroups.hasMany(models.machine_conditions, {
      as: 'machineConditions'
    });
    machineGroups.hasMany(models.machine_groups_groups, {
      as: 'machineGroupsGroups'
    });
    machineGroups.belongsTo(models.subunits);
    machineGroups.belongsTo(models.users);

    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };
  return machineGroups;
};
