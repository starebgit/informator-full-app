'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('roles', [
      {
        role: 'sfm'
      },
      {
        role: 'foreman'
      },
      {
        role: 'process_leader'
      },
      {
        role: 'head_of_work_unit'
      },
      {
        role: 'cip'
      },
      {
        role: 'admin'
      },
      {
        role: 'quality'
      },
      {
        role: 'toolshop'
      },
      {
        role: 'human_resources'
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
