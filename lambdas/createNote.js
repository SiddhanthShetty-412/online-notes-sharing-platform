const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.NOTES_BUCKET; // required
const TABLE = process.env.NOTES_TABLE; // required
const SECRET = process.env.JWT_SECRET || 'change_me';

const s3 = new S3Client({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

exports.handler = async (event) => {
  try {
    const auth = event.headers && (event.headers.Authorization || event.headers.authorization);
    if (!auth) return { statusCode: 401, body: JSON.stringify({ error: 'Missing Authorization' }) };
    const token = auth.split(' ')[1];
    const user = jwt.verify(token, SECRET);

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { title, subject, semester, tags = [], description = '', fileName, fileType, fileSize } = body || {};
    if (!fileName || !fileType) return { statusCode: 400, body: JSON.stringify({ error: 'fileName and fileType required' }) };

    if (!BUCKET || !TABLE) return { statusCode: 500, body: JSON.stringify({ error: 'Missing BUCKET or TABLE env vars' }) };

    const noteId = randomUUID();
    const key = `notes/${user.user_id}/${Date.now()}_${noteId}_${fileName.replace(/\s+/g, '_')}`;

    // presigned PUT URL
    const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: fileType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });

    // save metadata (mark as pending upload)
    const item = {
      noteId,
      userId: user.user_id,
      title: title || '',
      subject: subject || '',
      semester: semester || null,
      tags: Array.isArray(tags) ? tags : String(tags).split(',').map(s=>s.trim()).filter(Boolean),
      description,
      fileKey: key,
      fileType,
      fileSize: fileSize || null,
      uploadDate: new Date().toISOString(),
      downloads: 0,
      ratingAvg: 0,
      isApproved: process.env.AUTO_APPROVE === 'true' ? true : false,
    };

    await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));

    return {
      statusCode: 200,
      body: JSON.stringify({ noteId, uploadUrl: url, fileKey: key })
    };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const body = JSON.parse(event.body || '{}');
    const noteId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}`;
    const item = {
      noteId,
      title: body.title || '',
      content: body.content || '',
      timestamp: new Date().toISOString()
    };
    const params = { TableName: process.env.TABLE_NAME || 'NotesTable', Item: item };
    await dynamo.put(params).promise();
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Note created', noteId }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
