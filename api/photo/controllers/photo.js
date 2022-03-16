const { sanitizeEntity } = require('strapi-utils');
const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { v4: uuidv4 } = require('uuid');
const { photosUploadBucket } = require('../../../consts');

module.exports = {
  async create(ctx) {
    const entities = await Promise.all(
      ctx.request.body.map((item) =>
        strapi.services.photo.create({
          ...item,
          user: ctx.state.user.id,
        }),
      ),
    );
    return entities.map((entity) => ({
      ...sanitizeEntity(entity, { model: strapi.models.photo }),
      url: strapi.services.photo.getUrl(ctx.state.user.id, entity.s3uuid),
    }));
  },

  async update(ctx) {
    const { id } = ctx.params;
    const [photo] = await strapi.services.photo.find({
      id: ctx.params.id,
      'user.id': ctx.state.user.id,
    });
    if (!photo) {
      return ctx.unauthorized(`You can't update this entry`);
    }
    const entity = await strapi.services.photo.update({ id }, ctx.request.body);
    return sanitizeEntity(entity, { model: strapi.models.photo });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const [photo] = await strapi.services.photo.find({
      id: ctx.params.id,
      'user.id': ctx.state.user.id,
    });
    if (!photo) {
      return ctx.unauthorized(`You can't update this entry`);
    }
    const entity = await strapi.services.photo.delete({ id });
    return sanitizeEntity(entity, { model: strapi.models.photo });
  },

  async createPresignedUploadUrls(ctx) {
    const { uploadsLength } = ctx.request.body;
    const promises = [];
    const s3Client = new S3Client({
      region: 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    for (let i = 0; i < uploadsLength; i++) {
      const s3uuid = uuidv4();
      promises.push(
        new Promise((resolve) => {
          createPresignedPost(s3Client, {
            Bucket: photosUploadBucket,
            Key: strapi.services.photo.getS3Key(ctx.state.user.id, s3uuid),
            Fields: { 'Content-Type': 'image/jpeg' },
            Conditions: [['content-length-range', 0, 50 * 1024 * 1024]],
          }).then((presignedPost) => {
            resolve({
              presignedPost,
              s3uuid,
            });
          });
        }),
      );
    }
    return Promise.all(promises);
  },
};
