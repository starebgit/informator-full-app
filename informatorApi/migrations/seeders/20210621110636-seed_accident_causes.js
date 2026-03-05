'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('accident_causes', [
      { cause: 'carelessness' },
      { cause: 'workplace_disorder' },
      { cause: 'inadequate_work_equipment_or_means_of_work' },
      { cause: 'non-use_of_personal_protective_equipment' },
      {
        cause:
          'failure_to_follow_instructions_for_use_or_description_of_technological_process'
      },
      { cause: 'failure_to_follow_safety_instructions' },
      { cause: 'indiscipline' }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('accident_causes', null, {});
  }
};
