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

  async generateUploadUrl(ctx) {
    const { user } = ctx.state;
    const s3 = new S3Client({ region: 'eu-central-1' });
    const data = await createPresignedPost(s3, {
      Bucket: process.env.S3_UPLOAD_BUCKET,
      Key: `${user.id}-${new Date().toISOString()}.jpg`,
      Fields: {
        'Content-Type': 'image/jpeg',
      },
      Conditions: [['content-length-range', 0, 50 * 1024 * 1024]],
    });
    return data;
  },
};
