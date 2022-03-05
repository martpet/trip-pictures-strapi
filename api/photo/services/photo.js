module.exports = {
  getUrl(userId, s3uuid) {
    const bucket = process.env.S3_UPLOAD_BUCKET;
    const region = process.env.S3_REGION;
    const key = strapi.services.photo.getS3Key(userId, s3uuid);
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  },

  getS3Key(userId, s3uuid) {
    return `${userId}/${s3uuid}.jpg`;
  },
};
