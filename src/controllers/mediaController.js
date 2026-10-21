const mongoose = require('mongoose');
const multer = require('multer');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');

// Memory storage for incoming uploads before streaming into GridFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

exports.uploadMiddleware = upload.single('file');

function getGridFSBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new ApiError(500, 'Database connection is not ready');
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: 'media' });
}

// @desc  Upload a file (rulebook PDF, match replay .dem) to GridFS
// (20) GridFS Chunked Binary Storage — files are automatically divided into 255KB chunks
// stored across `media.files` and `media.chunks` collections.
exports.uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload a file via multipart form-data (field: "file")');
  }

  const bucket = getGridFSBucket();
  const filename = req.file.originalname || `upload-${Date.now()}`;

  const uploadStream = bucket.openUploadStream(filename, {
    contentType: req.file.mimetype || 'application/octet-stream',
    metadata: {
      category: req.body.category || 'Rulebook',
      tournamentId: req.body.tournamentId || null,
      uploadedAt: new Date(),
    },
  });

  uploadStream.end(req.file.buffer);

  await new Promise((resolve, reject) => {
    uploadStream.on('finish', resolve);
    uploadStream.on('error', reject);
  });

  res.status(201).json({
    success: true,
    message: 'File chunked and stored in MongoDB GridFS successfully',
    data: {
      fileId: uploadStream.id,
      filename,
      contentType: req.file.mimetype,
      sizeBytes: req.file.size,
      chunkSizeBytes: uploadStream.chunkSizeBytes,
    },
  });
});

// @desc  List uploaded files stored in GridFS
exports.getMediaList = asyncHandler(async (req, res) => {
  const db = mongoose.connection.db;
  const files = await db.collection('media.files').find().sort({ uploadDate: -1 }).toArray();

  res.json({
    success: true,
    count: files.length,
    description: 'Files stored in MongoDB GridFS chunked storage (media.files & media.chunks)',
    data: files,
  });
});

// @desc  Stream a file from GridFS chunked storage to client
exports.streamMedia = asyncHandler(async (req, res) => {
  const fileId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    throw new ApiError(400, 'Invalid file ID');
  }

  const db = mongoose.connection.db;
  const file = await db.collection('media.files').findOne({ _id: new mongoose.Types.ObjectId(fileId) });
  if (!file) {
    throw new ApiError(404, 'File not found in GridFS');
  }

  const bucket = getGridFSBucket();
  res.setHeader('Content-Type', file.contentType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);

  const downloadStream = bucket.openDownloadStream(file._id);
  downloadStream.on('error', (err) => {
    throw new ApiError(500, `Stream error: ${err.message}`);
  });
  downloadStream.pipe(res);
});
