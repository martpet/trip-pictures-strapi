const { sanitizeEntity } = require('strapi-utils');

const sanitizeUser = (user) =>
  sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model,
  });

module.exports = {
  async saveMySettings(ctx) {
    const { user } = ctx.state;
    const { id } = user;

    const data = await strapi.plugins['users-permissions'].services.user.edit(
      { id },
      { settings: Object.assign(user.settings || {}, ctx.request.body) },
    );

    ctx.send(sanitizeUser(data));
  },
};
