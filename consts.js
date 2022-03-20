module.exports = {
  photosUploadBucket: process.env.S3_UPLOAD_BUCKET || 'trip-pictures-uploads-dev',
  imageHandlerEndpoint:
    'https://d3kk629sdvd24v.cloudfront.net' || process.env.IMAGE_HANDLER_API_ENDPOINT,
};
