// Simple test runner for local Lambda handlers
// Usage: node tools\runLambdaTest.js createNote
const path = require('path');
const fs = require('fs');

async function run(name){
  const lambdaPath = path.join(__dirname, '..', 'lambdas', `${name}.js`);
  if (!fs.existsSync(lambdaPath)){
    console.error('Lambda not found:', lambdaPath);
    process.exit(2);
  }
  const mod = require(lambdaPath);
  if (!mod.handler) { console.error('No handler exported'); process.exit(3); }

  // sample events per function
  const samples = {
    createNote: { body: JSON.stringify({ title: 'Local test', content: 'Hello from local runner' }) },
    getAllNotes: { queryStringParameters: {} },
    updateNote: { body: JSON.stringify({ noteId: 'test-id', title: 'Updated locally', content: 'Updated content' }) },
    deleteNote: { pathParameters: { noteId: 'test-id' } }
  };

  const event = samples[name] || {};
  const context = {};

  try{
    const result = await mod.handler(event, context);
    console.log('--- RESULT ---');
    console.log(typeof result === 'object' ? JSON.stringify(result, null, 2) : result);
  }catch(err){
    console.error('Handler threw error:');
    console.error(err);
  }
}

const name = process.argv[2];
if (!name) { console.error('Usage: node tools\\runLambdaTest.js <lambdaName>'); process.exit(1); }
run(name);
