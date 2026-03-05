'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('categories', [
      {
        category: 'TPM'
      },
      {
        category: 'IM'
      },
      {
        category: '5S'
      },
      {
        category: 'miscellaneous'
      },
      {
        category: 'quality'
      },
      {
        category: 'indicators'
      },
      {
        category: 'realization'
      },
      {
        category: 'safety'
      },
      {
        category: 'LAS'
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
