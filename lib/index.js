"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = require("aws-sdk");
module.exports = {
    init(config) {
        const slash = (str) => str ? str + '/' : '';
        const makeKey = (file) => `${slash(folder)}${slash(file.path)}${file.hash}${file.ext}`;
        const isPublic = (acl) => acl.indexOf('public') > -1;
        const { params: { ACL = 'public-read', folder = null, Bucket = null } } = config;
        const S3 = new AWS.S3(Object.assign({ apiVersion: '2006-03-01' }, config));
        return {
            upload(file, customParams = {}) {
                return new Promise((resolve, reject) => {
                    S3.upload(Object.assign({ Key: makeKey(file), Bucket: Bucket, Body: Buffer.from(file.buffer, "binary"), StorageClass: 'STANDARD', ACL: ACL, ContentType: file.mime }, customParams), ((err, data) => {
                        if (err) {
                            return reject(err);
                        }
                        file.url = isPublic(ACL) ? data.Location : S3.getSignedUrl('getObject', {
                            Bucket: data.Bucket,
                            Key: data.Key,
                            Expires: 0
                        });
                        resolve();
                    }));
                });
            },
            delete(file, customParams = {}) {
                return new Promise((resolve, reject) => {
                    S3.deleteObject(Object.assign({ Key: makeKey(file), Bucket: Bucket }, customParams), (err, data) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                });
            }
        };
    }
};
