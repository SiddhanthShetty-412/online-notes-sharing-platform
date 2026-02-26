# 📝 **Online Notes Sharing System** 📚

## 💡 **Description**

The **Online Notes Sharing System** is a serverless web application designed to facilitate the seamless sharing of notes among users. Developed with **HTML**, **CSS**, **JavaScript**, **AWS Lambda**, **API Gateway**, and **DynamoDB**, this platform allows users to create, update, delete, and share notes effortlessly. Users can write and organize their notes through a clean interface, with all data securely stored and managed in the cloud using AWS services.

---

## 🚀 **Features**

* **📝 Create Notes:** Users can write and save notes with a title and content instantly.
* **✏️ Edit Notes:** Easily update existing notes with a single click.
* **🗑️ Delete Notes:** Remove notes you no longer need with a confirmation prompt.
* **🔗 Share Notes:** Generate and copy a shareable link for any note to share with others.
* **⚡ Serverless Backend:** Powered by AWS Lambda functions for scalable, cost-efficient server-side logic.
* **🗃️ DynamoDB Storage:** All notes are stored securely in AWS DynamoDB with fast read/write access.
* **🌐 API Gateway Integration:** RESTful API endpoints manage all CRUD operations seamlessly.
* **🎯 User-Friendly Interface:** Simple and intuitive design for easy note browsing and management.

---

## 💻 **Technologies Used**

* **🧱 HTML:** Structures the web pages and layout of the application.
* **🎨 CSS:** Styles the application for a clean and responsive interface.
* **⚙️ JavaScript (Vanilla):** Handles dynamic interactions, fetch API calls, and UI logic.
* **☁️ AWS Lambda:** Serverless functions that handle all backend logic including create, read, update, and delete operations.
* **🔗 AWS API Gateway:** Exposes RESTful HTTP endpoints that trigger the Lambda functions.
* **🗄️ AWS DynamoDB:** NoSQL database that stores all notes data securely in the cloud.

---

## 🏗️ **Architecture Overview**

```
Browser (index.html)
      │
      ▼
AWS API Gateway  (REST Endpoints)
      │
      ├── POST   /notes        → createNote.js  (Lambda)
      ├── GET    /notes        → getAllNotes.js  (Lambda)
      ├── PUT    /notes        → updateNote.js   (Lambda)
      └── DELETE /notes/{id}  → deleteNote.js   (Lambda)
                                        │
                                        ▼
                                 AWS DynamoDB
                                 (NotesTable)
```

---

## 🎯 **Ideal For**

* **🎓 Students:** Looking for a platform to write and share study notes with peers.
* **👩‍🏫 Educators:** Sharing lecture notes and resources with students.
* **🧑‍💼 Professionals:** Managing and sharing work-related notes securely in the cloud.
* **🌍 Anyone:** Who needs a simple, fast, and reliable way to organize and share notes online.

---

## ⚙️ **How to Run**

1. **📂 Clone the repository:**
   ```bash
   git clone <repository_url>
   cd online-notes-sharing-platform
   ```

2. **☁️ Set up AWS Services:**
   - Create a **DynamoDB** table named `NotesTable` with `noteId` as the partition key.
   - Deploy each Lambda function (`createNote.js`, `getAllNotes.js`, `updateNote.js`, `deleteNote.js`) to **AWS Lambda**.
   - Set the `TABLE_NAME` environment variable to `NotesTable` in each Lambda function.

3. **🔗 Configure API Gateway:**
   - Create a REST API in **AWS API Gateway**.
   - Map the following routes to their respective Lambda functions:
     - `POST /notes` → `createNote`
     - `GET /notes` → `getAllNotes`
     - `PUT /notes` → `updateNote`
     - `DELETE /notes/{noteId}` → `deleteNote`
   - Deploy the API and copy the **base URL**.

4. **🌐 Configure the Frontend:**
   - Open `index.html` and replace `REPLACE_WITH_API_BASE_URL` with your API Gateway base URL:
     ```js
     const API_BASE = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod';
     ```

5. **🚀 Launch the App:**
   - Open `index.html` directly in a browser or host it on **AWS S3**, **Netlify**, or **GitHub Pages**.

---

## 🧪 **Local Lambda Testing**

You can test Lambda functions locally using the provided `runLambdaTest.js` tool:

```bash
node tools/runLambdaTest.js createNote
node tools/runLambdaTest.js getAllNotes
node tools/runLambdaTest.js updateNote
node tools/runLambdaTest.js deleteNote
```

> **Note:** Local testing uses mock events and requires AWS credentials configured via `aws configure` for DynamoDB access.
