module.exports = ({ env }) => ({
  connections: {
    default: {
      connector: 'bookshelf',
      options: {},
      settings: {
        client: 'postgres',
        database: env('DATABASE_NAME', 'trip-pictures'),
        host: env('DATABASE_HOST', '127.0.0.1'),
        password: env('DATABASE_PASSWORD', ''),
        port: env.int('DATABASE_PORT', 5432),
        ssl: env.bool('DATABASE_SSL', false),
        username: env('DATABASE_USERNAME', ''),
      },
    },
  },
  defaultConnection: 'default',
});
