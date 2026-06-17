const AWS = require('aws-sdk');

const spacesEndpoint = process.env.SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com';
const BUCKET = process.env.SPACES_BUCKET || 'edulink-uploads';
const CDN_URL = `https://${BUCKET}.${spacesEndpoint}`;

const s3 = new AWS.S3({
  endpoint: `https://${spacesEndpoint}`,
  accessKeyId: process.env.SPACES_KEY || '',
  secretAccessKey: process.env.SPACES_SECRET || '',
  region: 'nyc3',
});

/**
 * Upload a buffer to Spaces and return the public CDN URL.
 */
async function uploadToSpaces(buffer, key, contentType) {
  await s3.putObject({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }).promise();
  return `${CDN_URL}/${key}`;
}

/**
 * Delete a file from Spaces by full URL or key.
 */
async function deleteFromSpaces(urlOrKey) {
  let key = urlOrKey;
  if (urlOrKey.startsWith('http')) {
    const u = new URL(urlOrKey);
    key = u.pathname.substring(1);
  }
  await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();
}

module.exports = { s3, uploadToSpaces, deleteFromSpaces, CDN_URL, BUCKET };
