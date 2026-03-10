const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = path.join(__dirname, 'notes.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT,
      course TEXT,
      semester INTEGER,
      subjects TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      note_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      subject TEXT,
      semester INTEGER,
      tags TEXT,
      description TEXT,
      file_path TEXT,
      file_type TEXT,
      file_size INTEGER,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      downloads INTEGER DEFAULT 0,
      rating_avg REAL DEFAULT 0,
      is_approved INTEGER DEFAULT 1,
      version INTEGER DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER,
      user_id INTEGER,
      comment_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(note_id) REFERENCES notes(note_id),
      FOREIGN KEY(user_id) REFERENCES users(user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER,
      user_id INTEGER,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(note_id) REFERENCES notes(note_id),
      FOREIGN KEY(user_id) REFERENCES users(user_id)
    )
  `);
});

module.exports = db;
