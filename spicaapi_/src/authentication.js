const {
  AuthenticationBaseStrategy,
  AuthenticationService
} = require('@feathersjs/authentication');
const { NotAuthenticated } = require('@feathersjs/errors');

class ApiKeyStrategy extends AuthenticationBaseStrategy {
  async authenticate(authentication) {
    const { token } = authentication;

    const config = this.authentication.configuration[this.name];

    const match = config.allowedKeys.includes(token);
    if (!match) throw new NotAuthenticated('Incorrect API key');

    return {
      apiKey: true
    };
  }
}

module.exports = (app) => {
  const authentication = new AuthenticationService(app);

  authentication.register('apiKey', new ApiKeyStrategy());

  app.use('/authentication', authentication);
};
