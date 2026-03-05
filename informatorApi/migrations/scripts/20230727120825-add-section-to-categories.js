'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.addColumn('categories', 'section', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'sfm'
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('categories', 'section');
  }
};
