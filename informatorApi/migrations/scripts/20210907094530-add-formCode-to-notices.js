'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('notices', 'form_code', {
      type: Sequelize.STRING,
      after: 'machine_code'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('notices', 'form_code');
  }
};
