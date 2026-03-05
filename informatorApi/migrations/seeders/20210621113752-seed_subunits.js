'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('subunits', [
      {
        name: 'Montaža 55.17',
        keyword: 'termo_55',
        ted: 404,
        unit_id: 1
      },
      {
        name: 'Diastat D1',
        keyword: 'termo_d1',
        ted: 401,
        unit_id: 1
      },
      {
        name: 'Diastat D2',
        keyword: 'termo_d2',
        ted: 402,
        unit_id: 1
      },
      {
        name: 'Diastat D3',
        keyword: 'termo_d3',
        ted: 403,
        unit_id: 1
      },
      {
        name: 'Montaža',
        keyword: 'plosca_montaza',
        ted: 201,
        unit_id: 2
      },
      {
        name: 'Keramika',
        keyword: 'plosca_keramika',
        ted: 202,
        unit_id: 2
      },
      {
        name: 'Obdelovalnica',
        keyword: 'livarna_obdelovalnica',
        ted: 601,
        unit_id: 3
      },
      {
        name: 'Brusilnica',
        keyword: 'livarna_brusilnica',
        ted: 602,
        unit_id: 3
      },
      {
        name: 'Robotske celice',
        keyword: 'livarna_robotske_celice',
        ted: 603,
        unit_id: 3
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('subunits', null, {});
  }
};
