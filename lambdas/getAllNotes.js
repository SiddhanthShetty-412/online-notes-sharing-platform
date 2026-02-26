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
