const Email = require('email-templates');

module.exports = function (app) {
  function getLink(type, hash) {
    const url =
      'http://informator.bfdom.com:3000/login/' + type + '/' + hash;
    return url;
  }

  function sendEmail(email) {
    return app
      .service('mailer')
      .create(email)
      .then(function (result) {
        console.log('Sent email', result);
      })
      .catch((err) => {
        console.log('Error sending email', err);
      });
  }

  return {
    service: '/users',
    path: 'auth-managment',
    notifier: async function (type, user, notifierOptions) {
      let tokenLink;
      let resetLink;
      let email;
      let html;
      const emailer = new Email();
      switch (type) {
        case 'resendVerifySignup': //sending the user the verification email
          tokenLink = getLink('activate', user.verifyToken);
          html = await emailer
            .render('resendVerifySignup', {
              name: user.name,
              username: user.username,
              url: tokenLink
            })
            .then((html) => html);
          email = {
            from: app.get('email'),
            to: user.email,
            subject: 'Zahteva za aktivacijo',
            html: html
          };
          return sendEmail(email);

        case 'verifySignup': // confirming verification
        case 'verifySignupSetPasswordLong':
          html = await emailer
            .render('verifySignup', { name: user.name })
            .then((html) => html);
          email = {
            from: app.get('email'),
            to: user.email,
            subject: 'Uspešna aktivacija',
            html: html
          };
          return sendEmail(email);

        case 'sendResetPwd':
          resetLink = getLink('reset', user.resetToken);
          html = await emailer
            .render('sendResetPwd', { name: user.name, url: resetLink })
            .then((html) => html);
          email = {
            from: app.get('email'),
            to: user.email,
            subject: 'Zahteva za ponastavitev gesla',
            html: html
          };
          return sendEmail(email);

        case 'resetPwd':
          html = await emailer
            .render('resetPwd', { name: user.name })
            .then((html) => html);
          email = {
            from: app.get('email'),
            to: user.email,
            subject: 'Geslo je bilo ponastavljeno',
            html: html
          };
          return sendEmail(email);

        case 'passwordChange':
          html = await emailer
            .render('passwordChange', { name: user.name })
            .then((html) => html);
          email = {
            from: app.get('email'),
            to: user.email,
            subject: 'Geslo je bilo spremenjeno',
            html: emailer
          };
          return sendEmail(email);

        case 'identityChange':
          tokenLink = getLink('verifyChanges', user.verifyToken);
          email = {
            from: app.get('email'),
            to: user.email,
            subject: 'Sprememba računa',
            html: 'Identity changed'
          };
          return sendEmail(email);

        default:
          break;
      }
    }
  };
};
