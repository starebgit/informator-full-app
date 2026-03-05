// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const {
      id,
      data: { machines }
    } = context;
    const machinesService = context.app.service('machines');
    await removeOldMachines(machinesService, +id);
    await addNewMachines(machinesService, +id, machines);

    return context;
  };
};

const removeOldMachines = async (service, foreignKey) => {
  await service.remove(null, { query: { machineGroupId: foreignKey } });
};

const addNewMachines = async (service, foreignKey, arrayOfMachines) => {
  if (arrayOfMachines) {
    await service.create(
      arrayOfMachines.map((machine) => ({
        ...machine,
        machineGroupId: foreignKey
      }))
    );
  }
};
