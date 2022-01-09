module.exports = ({ env }) => ({
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', '99aafc1fc29fa5a3730d8a0b56ed03ba'),
    },
    autoOpen: false,
    watchIgnoreFiles: ['**/config-sync/files/**'],
  },
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
});
