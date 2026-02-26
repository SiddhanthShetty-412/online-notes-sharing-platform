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
