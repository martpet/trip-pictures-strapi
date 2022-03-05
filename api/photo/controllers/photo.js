const { sanitizeEntity } = require('strapi-utils');
const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { v4: uuidv4 } = require('uuid');

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
    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.photo }),
    );
  },

  async createPresignedUploadUrls(ctx) {
    const { uploadsLength } = ctx.request.body;
    const { user } = ctx.state;
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
            Bucket: process.env.S3_UPLOAD_BUCKET,
            Key: createS3Key(user.id, s3uuid),
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

function createS3Key(userId, uuid) {
  return `${userId}/${uuid}.jpg`;
}
