module.exports = {
  host: 'localhost',
  port: process.env.PORT,
  public: '../public/',
  authentication: {
    secret: process.env.SECRET,
    authStrategies: ['apiKey'],
    service: 'employee',
    apiKey: {
      allowedKeys: [process.env.API_KEY_1, process.env.API_KEY_2],
      header: 'x-access-token',
      urlParam: 'token'
    }
  },
  db: process.env.DB,
  usr: process.env.USER,
  pass: process.env.PASS
};
