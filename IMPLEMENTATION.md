Minimal AWS Notes Sharing — Implementation & Deploy Notes

Files added:
- lambdas/createNote.js
- lambdas/getAllNotes.js
- lambdas/updateNote.js
- lambdas/deleteNote.js
- frontend/index.html

Quick deploy steps
1) DynamoDB
   - Console  DynamoDB  Create table
   - Table name: NotesTable
   - Partition key: noteId (String)

2) IAM Role for Lambda
   - IAM  Roles  Create role  AWS service  Lambda
   - Attach: AmazonDynamoDBFullAccess (or scoped policy), AWSLambdaBasicExecutionRole
   - Name: NotesAppLambdaRole

3) Create Lambda functions (use Node.js 18.x)
   - Create 4 functions, attach NotesAppLambdaRole
   - Copy each file from `lambdas/*.js` into the Lambda console editor
   - Set environment variable `TABLE_NAME` = NotesTable
   - Deploy each function

4) API Gateway (REST)
   - Create REST API -> Resource `/notes`
   - Methods:
     - POST -> Lambda: createNote
     - GET  -> Lambda: getAllNotes
     - PUT  -> Lambda: updateNote
   - Create Resource `/notes/{noteId}`
     - DELETE -> Lambda: deleteNote
   - Enable CORS on resources
   - Deploy (stage: prod) and copy the Invoke URL

5) Frontend
   - Open `frontend/index.html` and replace `REPLACE_WITH_API_BASE_URL` with the invoke URL (no trailing slash if stage included)
   - Upload `index.html` to an S3 bucket
   - Enable static website hosting and make the object public or configure CloudFront

Notes on editing
- There's no file editing on the server. The frontend loads note text from the API into a textarea. When the user saves, JS sends the text to the appropriate Lambda which updates DynamoDB.

Testing
- Create a note via the frontend -> check DynamoDB table
- Edit a note -> PUT should update timestamp
- Share: `?note=<noteId>` will pre-load the editor for that note

Security & next steps (optional)
- Restrict IAM/DynamoDB policies to only allow the Lambda role access to the table
- Add authentication (Cognito) if you need per-user notes
- Add pagination or limits for production
