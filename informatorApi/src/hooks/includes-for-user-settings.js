// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const sequelize = context.app.get('sequelizeClient');
    const settings = sequelize.models.settings;
    const allowedSettingsValue = sequelize.models.allowed_settings_value;

    context.params.sequelize = {
      include: [{ model: allowedSettingsValue }, { model: settings }],
      raw: false,
      nest: false
    };
    return context;
  };
};
