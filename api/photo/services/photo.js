const { imageHandlerEndpoint } = require('../../../consts');

module.exports = {
  getUrl(userId, s3uuid) {
    const data = {
      bucket: process.env.S3_UPLOAD_BUCKET,
      key: strapi.services.photo.getS3Key(userId, s3uuid),
    };
    const encodedData = Buffer.from(JSON.stringify(data), 'utf8').toString('base64');
    return `${imageHandlerEndpoint}/${encodedData}`;
  },

  getS3Key(userId, s3uuid) {
    return `${userId}/${s3uuid}.jpg`;
  },
};
