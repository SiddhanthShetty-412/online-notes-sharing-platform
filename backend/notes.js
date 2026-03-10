const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shortid = require('shortid');
const db = require('./db');
const { authenticateToken } = require('./middleware');

const router = express.Router();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const id = shortid.generate();
    const name = `${Date.now()}-${id}-${file.originalname}`.replace(/\s+/g, '_');
    cb(null, name);
  }
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  const { title, subject, semester, tags, description } = req.body;
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const file_path = `/uploads/${req.file.filename}`;
  db.run(
    `INSERT INTO notes (user_id,title,subject,semester,tags,description,file_path,file_type,file_size) VALUES (?,?,?,?,?,?,?,?,?)`,
    [req.user.user_id, title, subject, semester, tags, description, file_path, req.file.mimetype, req.file.size],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ note_id: this.lastID, file_path });
    }
  );
});

router.get('/', (req, res) => {
  // basic filters: subject, semester, fileType, sort
  const { subject, semester, fileType, q, page = 1, limit = 20, sort = 'upload_date' } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  if (subject) { conditions.push('subject = ?'); params.push(subject); }
  if (semester) { conditions.push('semester = ?'); params.push(semester); }
  if (fileType) { conditions.push('file_type LIKE ?'); params.push(fileType + '%'); }
  if (q) { conditions.push('(title LIKE ? OR description LIKE ? OR tags LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT note_id, user_id, title, subject, semester, tags, description, file_path, file_type, file_size, upload_date, downloads, rating_avg FROM notes ${where} ORDER BY ${sort} DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ notes: rows });
  });
});

router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM notes WHERE note_id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    // increment downloads asynchronously
    db.run(`UPDATE notes SET downloads = downloads + 1 WHERE note_id = ?`, [id]);
    res.json({ note: row, download_url: row.file_path });
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM notes WHERE note_id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    // allow owner or admin
    if (row.user_id !== req.user.user_id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    // delete file
    const diskPath = path.join(__dirname, row.file_path.replace('/uploads/', 'uploads/'));
    fs.unlink(diskPath, () => {});
    db.run(`DELETE FROM notes WHERE note_id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: true });
    });
  });
});

router.post('/:id/rate', authenticateToken, (req, res) => {
  const id = req.params.id;
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating 1-5 required' });
  db.run(`INSERT INTO ratings (note_id,user_id,rating) VALUES (?,?,?)`, [id, req.user.user_id, rating], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    // recompute avg
    db.get(`SELECT AVG(rating) as avg FROM ratings WHERE note_id = ?`, [id], (e, row) => {
      if (!e && row) db.run(`UPDATE notes SET rating_avg = ? WHERE note_id = ?`, [row.avg, id]);
    });
    res.json({ ok: true });
  });
});

router.post('/:id/comment', authenticateToken, (req, res) => {
  const id = req.params.id;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: 'comment required' });
  db.run(`INSERT INTO comments (note_id,user_id,comment_text) VALUES (?,?,?)`, [id, req.user.user_id, comment], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ comment_id: this.lastID });
  });
});

module.exports = router;
