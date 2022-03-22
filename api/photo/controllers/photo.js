const { sanitizeEntity } = require('strapi-utils');
const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { v4: uuidv4 } = require('uuid');
const { photosUploadBucket } = require('../../../consts');

module.exports = {
  async find(ctx) {
    const entities = await strapi.services.photo.find(ctx.query);
    return entities.map((entity) => ({
      ...sanitizeEntity(entity, { model: strapi.models.photo }),
      url: strapi.services.photo.getUrl(entity.user, entity.s3uuid),
    }));
  },

  async create(ctx) {
    const newEntitiesPromises = [];
    const oldEntitiesPromises = [];

    ctx.request.body.forEach(({ s3uuid, exif, duplicatePhotoId }) => {
      if (duplicatePhotoId) {
        oldEntitiesPromises.push(strapi.query('photo').findOne({ id: duplicatePhotoId }));
      } else {
        newEntitiesPromises.push(
          strapi.services.photo.create({ s3uuid, ...exif, user: ctx.state.user.id }),
        );
      }
    });

    const newEntities = await Promise.all(newEntitiesPromises);
    const oldEntities = await Promise.all(oldEntitiesPromises);
    const entities = [...newEntities, ...oldEntities];

    return entities.map((entity) => ({
      ...sanitizeEntity(entity, { model: strapi.models.photo }),
      url: strapi.services.photo.getUrl(ctx.state.user.id, entity.s3uuid),
    }));
  },

  // async update(ctx) {
  //   const { id } = ctx.params;
  //   const [photo] = await strapi.services.photo.find({
  //     id: ctx.params.id,
  //     'user.id': ctx.state.user.id,
  //   });
  //   if (!photo) {
  //     return ctx.unauthorized(`You can't update this entry`);
  //   }
  //   const entity = await strapi.services.photo.update({ id }, ctx.request.body);
  //   return sanitizeEntity(entity, { model: strapi.models.photo });
  // },

  // async delete(ctx) {
  //   const { id } = ctx.params;
  //   const [photo] = await strapi.services.photo.find({
  //     id: ctx.params.id,
  //     'user.id': ctx.state.user.id,
  //   });
  //   if (!photo) {
  //     return ctx.unauthorized(`You can't update this entry`);
  //   }
  //   const entity = await strapi.services.photo.delete({ id });
  //   return sanitizeEntity(entity, { model: strapi.models.photo });
  // },

  async createPresignedUploadUrls(ctx) {
    const uploads = ctx.request.body;
    const s3Client = new S3Client({
      region: 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    const duplicatePhotos = await strapi.query('photo').find({
      user: ctx.state.user.id,
      dateOriginal_in: uploads.map(({ exif }) => exif.dateOriginal),
      _limit: uploads.length,
    });

    const promises = [];
    uploads.forEach((upload) => {
      const s3uuid = uuidv4();
      const duplicatePhoto = duplicatePhotos.find(
        ({ dateOriginal }) => dateOriginal === upload.exif.dateOriginal,
      );
      promises.push(
        (async () => {
          const presignedPost = await createPresignedPost(s3Client, {
            Bucket: photosUploadBucket,
            Key: strapi.services.photo.getS3Key(ctx.state.user.id, s3uuid),
            Fields: { 'Content-Type': 'image/jpeg' },
            Conditions: [['content-length-range', 0, 50 * 1024 * 1024]],
          });

          const result = {
            uploadId: upload.id,
          };

          if (duplicatePhoto) {
            result.duplicatePhotoId = duplicatePhoto.id;
          } else {
            result.s3uuid = s3uuid;
            Object.assign(result, presignedPost);
          }

          return result;
        })(),
      );
    });

    return Promise.all(promises);
  },
};
