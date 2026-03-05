// See https://sequelize.org/master/manual/model-basics.html
// for more of what you can do here.
const Sequelize = require('sequelize');
const DataTypes = Sequelize.DataTypes;

module.exports = function (app) {
  const sequelizeClient = app.get('sequelizeClient');
  const documents = sequelizeClient.define(
    'documents',
    {
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
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
  documents.associate = function (models) {
    documents.belongsTo(models.subunits);
    documents.belongsTo(models.users);
    documents.belongsTo(models.categories);
    documents.belongsTo(models.subcategories);
    documents.belongsToMany(models.uploads, {
      through: 'documents_uploads'
    });
  };

  return documents;
};
