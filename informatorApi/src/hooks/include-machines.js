// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const machines = sequelize.models.machines;
    const groups = sequelize.models.machine_groups_groups;
    const machineConditions = sequelize.models.machine_conditions;
    const conditions = sequelize.models.conditions;

    context.params.sequelize = {
      include: [
        { model: machines },
        { model: groups, as: 'machineGroupsGroups' },
        {
          model: machineConditions,
          as: 'machineConditions',
          include: [{ model: conditions }]
        }
      ],
      raw: false,
      nest: true
    };

    return context;
  };
};
