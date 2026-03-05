// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async (context) => {
    const files = context.params.files; // transfer the received files to feathers
    // for transforming the request to the model shape
    const body = [];
    for (const file of files)
      body.push({
        description: context.data.description,
        name: file.originalname,
        path: file.path,
        size: file.size,
        userId: context.params.user.id ? context.params.user.id : null
      });
    context.data = context.method === 'create' ? body : body[0];

    return context;
  };
};
