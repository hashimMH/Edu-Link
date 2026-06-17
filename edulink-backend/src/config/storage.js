const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  endpoint: process.env.SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  region: 'nyc3',
  credentials: {
    accessKeyId: process.env.SPACES_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET || '',
  },
  forcePathStyle: false,
});

const BUCKET = process.env.SPACES_BUCKET || 'edulink-uploads';
const CDN_URL = process.env.SPACES_CDN || `https://${BUCKET}.${process.env.SPACES_REGION || 'nyc3'}.digitaloceanspaces.com`;

/**
 * Upload a buffer to Spaces and return the public CDN URL.
 * @param {Buffer} buffer - file buffer
 * @param {string} key - path in bucket (e.g. 'avatars/abc123.jpg')
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - public CDN URL
 */
async function uploadToSpaces(buffer, key, contentType) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  });
  await s3.send(cmd);
  return `${CDN_URL}/${key}`;
}

/**
 * Delete a file from Spaces by full URL or key.
 */
async function deleteFromSpaces(urlOrKey) {
  let key = urlOrKey;
  if (urlOrKey.startsWith('http')) {
    // Extract key from CDN URL
    const u = new URL(urlOrKey);
    key = u.pathname.substring(1); // remove leading /
  }
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(cmd);
}

module.exports = { s3, uploadToSpaces, deleteFromSpaces, CDN_URL, BUCKET };
