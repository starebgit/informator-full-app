'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('allowed_settings_value', [
      {
        item_value: 'en',
        caption: 'english',
        setting_id: 1
      },
      {
        item_value: 'de',
        caption: 'german',
        setting_id: 1
      },
      {
        item_value: 'si',
        caption: 'slovenian',
        setting_id: 1
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('allowed_settings_value', null, {});
  }
};
