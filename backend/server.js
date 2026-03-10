const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./auth');
const notesRoutes = require('./notes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

app.use('/uploads', express.static(uploadsDir));
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

app.get('/', (req, res) => res.json({ ok: true, message: 'Notes backend running' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
