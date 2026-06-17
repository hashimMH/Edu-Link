const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('./database');
const ApiError = require('../utils/ApiError');

let S3 = null;
function getS3() {
  if (S3 !== null) return S3;
  try {
    const AWS = require('aws-sdk');
    const key = process.env.SPACES_KEY;
    const secret = process.env.SPACES_SECRET;
    const bucket = process.env.SPACES_BUCKET || 'edulink-uploads';
    const endpoint = process.env.SPACES_ENDPOINT || 'nyc3.digitaloceanspaces.com';
    if (!key || !secret) { console.warn('[S3] Credentials missing'); return (S3 = false); }
    S3 = { client: new AWS.S3({ endpoint: endpoint, s3ForcePathStyle: false, accessKeyId: key, secretAccessKey: secret, region: 'nyc3' }), bucket, cdn: `https://${bucket}.${endpoint}` };
    console.log('[S3] DO Spaces ready');
    return S3;
  } catch(e) { console.warn('[S3] Init failed:', e.message); return (S3 = false); }
}

async function uploadToS3(buffer, key, contentType) {
  const s3 = getS3();
  if (!s3) return null;
  await s3.client.putObject({ Bucket: s3.bucket, Key: key, Body: buffer, ContentType: contentType, ACL: 'public-read' }).promise();
  return `${s3.cdn}/${key}`;
}

async function deleteFromS3(url) {
  const s3 = getS3();
  if (!s3) return;
  const key = url.startsWith('http') ? new URL(url).pathname.substring(1) : url;
  await s3.client.deleteObject({ Bucket: s3.bucket, Key: key }).promise();
}

module.exports = { getS3, uploadToS3, deleteFromS3 };
