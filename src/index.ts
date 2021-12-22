import * as AWS from 'aws-sdk';

interface File {
    path: string;
    url: string;
    hash: string;
    ext: string;
    buffer: string;
    mime: string;
}

module.exports = {

    init(config: AWS.S3.ClientConfiguration & any) {

        const slash = (str: string) => str ? str + '/' : '';
        const makeKey = (file: File) => `${slash(folder)}${slash(file.path)}${file.hash}${file.ext}`;
        const isPublic = (acl: string | string[]) => acl.indexOf('public') > -1;

        const { params: { ACL = 'public-read', folder = null, Bucket = null } } = config;
        const S3 = new AWS.S3({
            apiVersion: '2006-03-01',
            ...config
        });

        return {
            upload(file: File, customParams = {}) {
                return new Promise<void>((resolve, reject) => {
                    S3.upload({
                        Key: makeKey(file),
                        Bucket: Bucket,
                        Body: Buffer.from(file.buffer, "binary"),
                        StorageClass: 'STANDARD',
                        ACL: ACL,
                        ContentType: file.mime,
                        ...customParams,
                    }, ((err: Error, data: AWS.S3.ManagedUpload.SendData) => {
                        if (err) {
                            return reject(err);
                        }
                        file.url = isPublic(ACL) ? data.Location : S3.getSignedUrl('getObject', {
                            Bucket: data.Bucket,
                            Key: data.Key,
                            Expires: 0
                        });
                        resolve();
                    }))
                });
            },

            delete(file: File, customParams = {}) {
                return new Promise<void>((resolve, reject) => {

                    S3.deleteObject({
                        Key: makeKey(file),
                        Bucket: Bucket,
                        ...customParams,
                    }, (err: Error, data: AWS.S3.DeleteObjectOutput) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    });
                });
            }
        }
    }
}