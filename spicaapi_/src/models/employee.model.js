// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const employee = sequelizeClient.define(
    'employee',
    {
      id: {
        field: 'NO',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      phone: {
        field: 'PHONE',
        type: DataTypes.STRING
      },
      mobilePhone: {
        field: 'MOBILEPHONE',
        type: DataTypes.STRING
      },
      employeeId: {
        field: 'ID',
        type: DataTypes.INTEGER
      },
      firstName: {
        field: 'FIRSTNAME',
        type: DataTypes.STRING
      },
      lastName: {
        field: 'LASTNAME',
        type: DataTypes.STRING
      },
      address: {
        field: 'ADDRESS',
        type: DataTypes.STRING
      },
      city: {
        field: 'CITY',
        type: DataTypes.STRING
      },
      superior: {
        field: 'SUBDEPARTMENT',
        type: DataTypes.STRING
      },
      email: {
        field: 'EMAIL',
        type: DataTypes.STRING
      },
      department: {
        field: 'DIVISION',
        type: DataTypes.STRING
      }
    },
    {
      timestamps: false,
      tableName: 'USERS',
      hooks: {
        beforeCount(options) {
          options.raw = true;
        }
      }
    }
  );

  // eslint-disable-next-line no-unused-vars
  employee.associate = function (models) {
    employee.hasOne(models.badges, { foreignKey: 'USERNO' });
    // Define associations here
    // See http://docs.sequelizejs.com/en/latest/docs/associations/
  };

  return employee;
};
