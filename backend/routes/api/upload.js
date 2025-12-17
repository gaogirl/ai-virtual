const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.wav';
    const name = Date.now() + '-' + Math.random().toString(16).slice(2) + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

router.post('/audio', protect, upload.single('file'), (req, res) => {
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;

