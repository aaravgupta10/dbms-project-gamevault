const express = require('express');
const {
  uploadMiddleware,
  uploadMedia,
  getMediaList,
  streamMedia,
} = require('../controllers/mediaController');

const router = express.Router();

// (20) GridFS Chunked Binary Storage — upload, browse, and stream
router.post('/upload', uploadMiddleware, uploadMedia);
router.get('/', getMediaList);
router.get('/:id/stream', streamMedia);

module.exports = router;
