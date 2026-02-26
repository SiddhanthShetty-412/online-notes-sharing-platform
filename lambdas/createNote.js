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
