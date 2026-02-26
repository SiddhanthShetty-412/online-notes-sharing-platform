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
