'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('units', [
      {
        name: 'thermo',
        sfm: true
      },
      {
        name: 'hotplate',
        sfm: true
      },
      {
        name: 'foundry',
        sfm: true
      },
      {
        name: 'ptc',
        sfm: true
      },
      {
        name: 'dess',
        sfm: false
      },
      {
        name: 'dess 1',
        sfm: false
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('units', null, {});
  }
};
