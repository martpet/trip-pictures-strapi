const { sanitizeEntity } = require('strapi-utils');
const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');

module.exports = {
  async create(ctx) {
    const entity = await strapi.services.photo.create({
      ...ctx.request.body,
      user: ctx.state.user.id,
    });

    return sanitizeEntity(entity, { model: strapi.models.photo });
  },

  async createPresignedUploadUrls(ctx) {
    const { user } = ctx.state;
    const { uploadsLength } = ctx.request.body;
    const s3Promises = [];

    const s3 = new S3Client({
      region: 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    for (let i = 0; i < uploadsLength; i++) {
      s3Promises.push(
        createPresignedPost(s3, {
          Bucket: process.env.S3_UPLOAD_BUCKET,
          Key: `${user.id}--${new Date().toISOString()}--${i + 1}.jpg`,
          Fields: { 'Content-Type': 'image/jpeg' },
          Conditions: [['content-length-range', 0, 50 * 1024 * 1024]],
        }),
      );
    }

    return Promise.all(s3Promises);
  },
};
