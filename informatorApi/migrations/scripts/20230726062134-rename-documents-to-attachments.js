'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    queryInterface.showAllTables().then(async (tables) => {
      if (tables.indexOf('documents') === -1) {
        return;
      } else {
        queryInterface.renameTable('documents', 'attachments');
        queryInterface.renameTable('documents_uploads', 'attachments_uploads');
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable('attachments', 'documents');
    await queryInterface.renameTable(
      'attachments_uploads',
      'documents_uploads'
    );
  }
};
