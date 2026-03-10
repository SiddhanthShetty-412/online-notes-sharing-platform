const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.NOTES_BUCKET;
const TABLE = process.env.NOTES_TABLE;
const SECRET = process.env.JWT_SECRET || 'change_me';

const s3 = new S3Client({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

exports.handler = async (event) => {
  try {
    const auth = event.headers && (event.headers.Authorization || event.headers.authorization);
    if (!auth) return { statusCode: 401, body: JSON.stringify({ error: 'Missing Authorization' }) };
    const token = auth.split(' ')[1];
    const user = jwt.verify(token, SECRET);

    const id = event.pathParameters && event.pathParameters.id;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing id' }) };

    const existing = await ddb.send(new GetCommand({ TableName: TABLE, Key: { noteId: id } }));
    if (!existing.Item) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
    if (existing.Item.userId !== user.user_id && user.role !== 'admin') return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };

    // delete s3 object if present
    if (existing.Item.fileKey && BUCKET) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: existing.Item.fileKey }));
    }

    await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { noteId: id } }));
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const table = process.env.TABLE_NAME || 'NotesTable';
    const id = (event.pathParameters && event.pathParameters.noteId) || (event.queryStringParameters && event.queryStringParameters.noteId);
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'noteId required' }) };
    const params = { TableName: table, Key: { noteId: id } };
    await dynamo.delete(params).promise();
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Note deleted' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
