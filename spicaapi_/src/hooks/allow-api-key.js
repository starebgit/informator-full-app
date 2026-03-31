// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

/* eslint-disable require-atomic-updates */
module.exports = function (options = {}) {
  // eslint-disable-line no-unused-vars
  return async (context) => {
    const { params } = context;

    const token =
      params.query[server.auth.apiKey.urlParam] ||
      params.headers[server.auth.apiKey.header];

    if (token && params.provider && !params.authentication) {
      context.params = {
        ...params,
        authentication: {
          strategy: 'apiKey',
          token
        }
      };
    }

    return context;
  };
};
