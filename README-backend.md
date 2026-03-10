# Notes Backend (demo)

Setup (Node.js required):

1. cd backend
2. npm install
3. npm start

Server runs on http://localhost:3000

Endpoints (demo):
- POST /auth/register {name,email,password,role}
- POST /auth/login {email,password}
- POST /notes/upload (multipart form-data) fields: file,title,subject,semester,tags,description
- GET /notes
- GET /notes/:id

This is a minimal demo using SQLite and local file storage. For production use, swap SQLite for Postgres, and local uploads for S3 presigned uploads, add HTTPS and token security adjustments.
