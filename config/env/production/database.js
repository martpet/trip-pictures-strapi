const { parse } = require('pg-connection-string');

const config = parse(process.env.DATABASE_URL);

module.exports = () => ({
  connections: {
    default: {
      connector: 'bookshelf',
      options: {
        ssl: true,
      },
      settings: {
        client: 'postgres',
        database: config.database,
        host: config.host,
        password: config.password,
        port: config.port,
        ssl: {
          rejectUnauthorized: false,
        },
        username: config.user,
      },
    },
  },
  defaultConnection: 'default',
});
