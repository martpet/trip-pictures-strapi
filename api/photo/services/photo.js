const { imageHandlerEndpoint } = require('../../../consts');

module.exports = {
  getUrl(userId, s3uuid) {
    const imageRequest = JSON.stringify({
      bucket: process.env.S3_UPLOAD_BUCKET,
      key: strapi.services.photo.getS3Key(userId, s3uuid),
    });
    return `${imageHandlerEndpoint}/${btoa(imageRequest)}`;
  },

  getS3Key(userId, s3uuid) {
    return `${userId}/${s3uuid}.jpg`;
  },
};
