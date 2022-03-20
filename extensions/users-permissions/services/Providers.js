/* eslint-disable consistent-return */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable camelcase */
/* eslint-disable import/no-extraneous-dependencies */
const request = require('request');
const purest = require('purest')({ request });
const purestConfig = require('@purest/providers');

const getProfile = async (provider, query, callback) => {
  const { access_token } = query;

  switch (provider) {
    case 'facebook': {
      const facebook = purest({
        config: purestConfig,
        provider: 'facebook',
      });
      facebook
        .query()
        .get('me?fields=email,first_name,last_name,picture')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: `fb-${body.id}`,
              facebookId: body.id,
              email: body.email,
              firstName: body.first_name,
              lastName: body.last_name,
              pictureIsSilhouette: body.picture.data.is_silhouette,
              pictureUrl: body.picture.data.url,
            });
          }
        });
      break;
    }
    default:
      callback(new Error('Unknown provider.'));
      break;
  }
};

const connect = (provider, query) => {
  const { access_token } = query;

  return new Promise((resolve, reject) => {
    if (!access_token) {
      return reject([null, { message: 'No access_token.' }]);
    }

    getProfile(provider, query, async (err, profile) => {
      if (err) {
        return reject([null, err]);
      }

      try {
        const user = await strapi.query('user', 'users-permissions').findOne({
          [`${provider}Id`]: profile[`${provider}Id`],
        });

        const userWithSameEmail = await strapi
          .query('user', 'users-permissions')
          .findOne({
            email: profile.email,
          });

        if (user && userWithSameEmail && user.id !== userWithSameEmail.id) {
          strapi
            .query('user', 'users-permissions')
            .update({ id: userWithSameEmail.id }, { email: null });
        }

        const { allow_register, default_role } = await strapi
          .store({
            environment: '',
            key: 'advanced',
            name: 'users-permissions',
            type: 'plugin',
          })
          .get();

        if (!user && !allow_register) {
          return resolve([
            null,
            [{ messages: [{ id: 'Auth.advanced.allow_register' }] }],
            'Register action is actually not available.',
          ]);
        }

        if (user) {
          const profileWithUsername = { ...profile };
          delete profileWithUsername.username;
          const updatedUser = await strapi
            .query('user', 'users-permissions')
            .update({ id: user.id }, profileWithUsername);
          return resolve([updatedUser, null]);
        }

        const role = await strapi
          .query('role', 'users-permissions')
          .findOne({ type: default_role }, []);

        const params = {
          ...profile,
          provider,
          role: role.id,
          confirmed: true,
        };

        const createdUser = await strapi
          .query('user', 'users-permissions')
          .create(params);

        return resolve([createdUser, null]);
      } catch (e) {
        reject([null, e]);
      }
    });
  });
};

const buildRedirectUri = (provider = '') =>
  `${
    process.env.FRONTEND_APP_URL || 'http://localhost:3001'
  }/api/connect/${provider}/callback`;

module.exports = {
  buildRedirectUri,
  connect,
};
