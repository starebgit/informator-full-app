module.exports = {
  host: 'localhost',
  port: process.env.PORT,
  public: '../public/',
  paginate: {
    default: 10000,
    max: 100000
  },
  authentication: {
    entity: 'user',
    service: 'users',
    secret: process.env.SECRET,
    authStrategies: ['jwt', 'local'],
    jwtOptions: {
      header: {
        typ: 'access'
      },
      audience: 'https://yourdomain.com',
      issuer: 'feathers',
      algorithm: 'HS256',
      expiresIn: '21d'
    },
    local: {
      usernameField: '\\username',
      passwordField: 'password'
    }
  },

  mssql: process.env.MSSQL,
  mssql_notices: process.env.MSSQL_NOTICES,
  mssql_static: process.env.MSSQL_STATIC,

  email: 'informator@egoproducts.com',
  mdocs_pass: process.env.MDOCS_PASS
};
