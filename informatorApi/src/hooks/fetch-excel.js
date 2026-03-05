const fs = require('fs');
const xlsx = require('xlsx');

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const workbook = new xlsx.readFile(
      '\\\\server-glt\\Liv_izmet\\PLAN DE LIVARNA\\2021\\BRUSILNICA plan 2021.xlsx',
      { type: 'buffer', cellDates: true, dateNF: 'YYYY-MM-DD' }
    );
    var o = {};
    workbook.SheetNames.forEach((name) => {
      o[name] = xlsx.utils.sheet_to_json(workbook.Sheets[name], {
        dateNF: 'YYYY-MM-DD'
      });
    });
    const keys = Object.keys(o['NORMATIVI - novi'][0]).map((value) => {
      return { value: value };
    });
    const data = [];
    data.push(keys);
    o['NORMATIVI - novi'].forEach((element) => {
      data.push(
        Object.values(element).map((value) => {
          return { value: value };
        })
      );
    });
    context.result = data;

    return context;
  };
};
