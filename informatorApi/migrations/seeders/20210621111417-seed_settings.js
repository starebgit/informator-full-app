'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('settings', [
      {
        description: 'language',
        constrained: 1,
        data_type: 'INTEGER',
        default_value: 1
      },
      {
        description: 'layout',
        constrained: 0,
        data_type: 'JSON',
        default_value: '{}'
      },
      {
        description: 'defaultSubunit',
        constrained: 0,
        data_type: 'STRING',
        default_value: 'termo_d1'
      },
      {
        description: 'selectedMachines',
        constrained: 0,
        data_type: 'JSON',
        default_value: '[]'
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('settings', null, {});
  }
};
