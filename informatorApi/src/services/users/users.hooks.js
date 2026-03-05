const { authenticate } = require('@feathersjs/authentication').hooks;
const verifyHooks = require('feathers-authentication-management').hooks;
const commonHooks = require('feathers-hooks-common');
const accountService = require('../auth-managment/notifier');
const { hashPassword, protect } =
  require('@feathersjs/authentication-local').hooks;
const initSettings = require('../../hooks/init-settings');
const includeRole = require('../../hooks/include-role');

const jsonize = require('../../hooks/jsonize');

module.exports = {
  before: {
    all: [jsonize()],
    find: [authenticate('jwt'), includeRole()],
    get: [authenticate('jwt'), includeRole()],
    create: [
      hashPassword('password'),
      verifyHooks.addVerification('auth-managment')
    ],
    update: [commonHooks.disallow('external')],
    patch: [
      commonHooks.iff(
        commonHooks.isProvider('external'),
        commonHooks.preventChanges(
          true,

          [
            'email',
            'isVerified',
            'verifyToken',
            'verifyShortToken',
            'verifyExpires',
            'verifyChanges',
            'resetToken',
            'resetShortToken',
            'resetExpires'
          ]
        ),
        hashPassword('password'),
        authenticate('jwt')
      )
    ],
    remove: [authenticate('jwt')]
  },

  after: {
    all: [
      // Make sure the password field is never sent to the client
      // Always must be the last hook

      protect('password')
    ],
    find: [],
    get: [],
    create: [
      initSettings(),
      (context) => {
        accountService(context.app).notifier(
          'resendVerifySignup',
          context.result
        );
      },
      verifyHooks.removeVerification()
    ],
    //create: [initSettings()],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
