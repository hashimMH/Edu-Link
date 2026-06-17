const AWS = require('aws-sdk');

const BUCKET = process.env.SPACES_BUCKET || 'edulink-uploads';
const spacesEndpoint = process.env.SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com';
const CDN_URL = `https://${BUCKET}.${spacesEndpoint}`;

let s3 = null;

function getS3() {
  if (s3) return s3;
  const key = process.env.SPACES_KEY;
  const secret = process.env.SPACES_SECRET;
  if (!key || !secret) {
    console.warn('[Storage] SPACES_KEY/SPACES_SECRET not set — uploads disabled');
    return null;
  }
  s3 = new AWS.S3({
    endpoint: `https://${spacesEndpoint}`,
    accessKeyId: key,
    secretAccessKey: secret,
    region: 'nyc3',
  });
  console.log('[Storage] DO Spaces configured');
  return s3;
}

async function uploadToSpaces(buffer, key, contentType) {
  const client = getS3();
  if (!client) return null;
  await client.putObject({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read',
  }).promise();
  return `${CDN_URL}/${key}`;
}

async function deleteFromSpaces(urlOrKey) {
  const client = getS3();
  if (!client) return;
  let k = urlOrKey;
  if (urlOrKey.startsWith('http')) k = new URL(urlOrKey).pathname.substring(1);
  await client.deleteObject({ Bucket: BUCKET, Key: k }).promise();
}

module.exports = { getS3, uploadToSpaces, deleteFromSpaces, CDN_URL, BUCKET };
