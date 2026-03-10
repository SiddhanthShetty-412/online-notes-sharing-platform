const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const jwt = require('jsonwebtoken');

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE = process.env.NOTES_TABLE;
const SECRET = process.env.JWT_SECRET || 'change_me';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

exports.handler = async (event) => {
  try {
    const auth = event.headers && (event.headers.Authorization || event.headers.authorization);
    if (!auth) return { statusCode: 401, body: JSON.stringify({ error: 'Missing Authorization' }) };
    const token = auth.split(' ')[1];
    const user = jwt.verify(token, SECRET);

    const id = event.pathParameters && event.pathParameters.id;
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing id' }) };
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    // check ownership
    const existing = await ddb.send(new GetCommand({ TableName: TABLE, Key: { noteId: id } }));
    if (!existing.Item) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
    if (existing.Item.userId !== user.user_id && user.role !== 'admin') return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };

    const updates = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    let idx = 0;
    for (const k of ['title','subject','semester','tags','description','isApproved']) {
      if (k in body) {
        idx++;
        const nameKey = `#f${idx}`;
        const valKey = `:v${idx}`;
        ExpressionAttributeNames[nameKey] = k;
        ExpressionAttributeValues[valKey] = body[k];
        updates.push(`${nameKey} = ${valKey}`);
      }
    }
    if (!updates.length) return { statusCode: 400, body: JSON.stringify({ error: 'No updatable fields provided' }) };

    const UpdateExpression = 'SET ' + updates.join(', ');
    await ddb.send(new UpdateCommand({ TableName: TABLE, Key: { noteId: id }, UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues }));
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
    const body = JSON.parse(event.body || '{}');
    if (!body.noteId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'noteId required' }) };
    const params = {
      TableName: process.env.TABLE_NAME || 'NotesTable',
      Key: { noteId: body.noteId },
      UpdateExpression: 'set title = :t, content = :c, timestamp = :ts',
      ExpressionAttributeValues: {
        ':t': body.title || '',
        ':c': body.content || '',
        ':ts': new Date().toISOString()
      }
    };
    await dynamo.update(params).promise();
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Note updated' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
