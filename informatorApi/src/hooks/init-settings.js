// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    if (context.result) {
      //ID of user
      const { id } = context.result;
      //Find all settings
      await context.app
        .service('/settings')
        .find()
        .then(async (results) => {
          const { data } = results;
          //For each setting add default
          for (const setting of data) {
            let defaultValue = setting.defaultValue;
            if (setting.constrained == 1) {
              await context.app
                .service('/user-settings')
                .create({
                  settingId: setting.id,
                  userId: id,
                  allowedSettingsValueId: defaultValue
                })
                .then((result) => {
                  console.log('Finished importing (constrained)');
                });
            } else {
              await context.app
                .service('/user-settings')
                .create({
                  settingId: setting.id,
                  userId: id,
                  unconstrainedValue: defaultValue
                })
                .then((result) => {
                  console.log('Finished importing (unconstrained)');
                });
            }
          }
        });
    }
    return context;
  };
};
