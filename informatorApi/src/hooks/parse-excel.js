// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const xlsx = require('xlsx');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeStaticClient');
    const productionDataStatic = sequelize.models.production_data_static;
    const groupsStatic = sequelize.models.groups_static;

    const files = context.params.files;
    const workbook = xlsx.read(files[0].buffer, {
      type: 'buffer',
      cellDates: true,
      dateNF: 'yyyy/mm/dd;@'
    });
    var o = {};
    workbook.SheetNames.forEach(function (name) {
      o[name] = xlsx.utils.sheet_to_json(workbook.Sheets[name]);
    });

    const groups = await groupsStatic.findAll();

    //Name of data sheet
    const fileData = o['Realizacija Termo'];

    const withIds = await Promise.all(
      fileData.map(async (row) => {
        //Find groupStaticId matching the name of the group
        const [groupStaticId] = groups.filter((group) => {
          return group.dataValues.name == row.skupina.trim();
        });

        //If we wound matcing string in dictionary we add it to the row
        if (groupStaticId.dataValues) {
          //We check if row already exists with this date and groupsStaticId
          const id = await productionDataStatic.findOne({
            where: {
              date: row.datum,
              groupsStaticId: groupStaticId.dataValues.id
            }
          });
          let total = row.dobro;
          if (row.izmet) {
            total += row.izmet;
          }
          return {
            id: id ? id.id : undefined,
            date: row.datum,
            total: total,
            good: row.dobro,
            bad: row.izmet,
            groupsStaticId: groupStaticId.dataValues.id
          };
        }
        return {
          date: row.datum,
          total: total,
          good: row.dobro,
          bad: row.izmet,
          groupsStaticId: undefined
        };
      })
    );

    await productionDataStatic.bulkCreate(withIds, {
      updateOnDuplicate: ['total', 'good', 'bad', 'updatedAt']
    });

    context.result = { response: [...withIds] };

    return context;
  };
};
