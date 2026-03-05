'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'attachments_uploads',
      'document_id',
      'attachment_id'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'attachments_uploads',
      'attachment_id',
      'document_id'
    );
  }
};
