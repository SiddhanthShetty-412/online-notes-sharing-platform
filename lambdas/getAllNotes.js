const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE = process.env.NOTES_TABLE;

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

exports.handler = async (event) => {
  try {
    if (!TABLE) return { statusCode: 500, body: JSON.stringify({ error: 'Missing NOTES_TABLE' }) };
    const params = { TableName: TABLE };
    // simple scan; for production use queries / indexes
    const result = await ddb.send(new ScanCommand(params));
    const items = result.Items || [];

    // optional simple filtering via query params
    const q = event.queryStringParameters || {};
    let filtered = items;
    if (q.subject) filtered = filtered.filter(it => it.subject === q.subject);
    if (q.semester) filtered = filtered.filter(it => String(it.semester) === String(q.semester));
    if (q.q) filtered = filtered.filter(it => (it.title || '').toLowerCase().includes(q.q.toLowerCase()) || (it.description || '').toLowerCase().includes(q.q.toLowerCase()));

    return { statusCode: 200, body: JSON.stringify({ notes: filtered }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const q = event.queryStringParameters || {};
    const table = process.env.TABLE_NAME || 'NotesTable';
    if (q.noteId) {
      const params = { TableName: table, Key: { noteId: q.noteId } };
      const data = await dynamo.get(params).promise();
      return { statusCode: 200, headers, body: JSON.stringify(data.Item || {}) };
    }
    const params = { TableName: table };
    const data = await dynamo.scan(params).promise();
    return { statusCode: 200, headers, body: JSON.stringify(data.Items || []) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
