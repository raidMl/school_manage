const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { query } = require('../config/db');

const router = express.Router();

// Base upload directories
const uploadsDir = path.resolve(__dirname, '../../uploads');
const adminFilesDir = path.join(uploadsDir, 'administrative_files');

// Ensure upload directories exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(adminFilesDir)) {
  fs.mkdirSync(adminFilesDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, adminFilesDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const rawName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_')
      .slice(0, 30);
    const rand = crypto.randomBytes(4).toString('hex');
    const safeName = `admin_doc_${rawName || 'file'}_${Date.now()}_${rand}${ext}`;
    cb(null, safeName);
  }
});

// File filter for scanned papers / administrative files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.doc', '.docx', '.odt', '.rtf', '.txt'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isImageOrPdfMime = file.mimetype && (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('word') ||
    file.mimetype.includes('officedocument') ||
    file.mimetype === 'application/octet-stream'
  );

  if (allowedExtensions.includes(ext) || isImageOrPdfMime) {
    cb(null, true);
  } else {
    cb(new HttpError(400, 'Invalid file format. Please upload a PDF, image (JPG, PNG, WebP), or Word document.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB limit for high-res scanned documents
  }
});

// Middleware to handle multer upload cleanly with error reporting
function handleSingleUpload(fieldName) {
  return function (req, res, next) {
    upload.single(fieldName)(req, res, function (err) {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new HttpError(400, 'File too large. Maximum size is 25MB.'));
          }
          return next(new HttpError(400, err.message));
        }
        return next(err);
      }
      next();
    });
  };
}

// Optional Auth middleware: validates token if present, but does not block registration uploads
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const { verifyAuthToken } = require('../utils/jwt');
      req.auth = verifyAuthToken(authHeader.slice(7));
    }
  } catch (e) {
    // ignore
  }
  next();
}

// Helper to safely delete an old administrative file from disk
function safelyRemoveFile(filePathOrUrl) {
  if (!filePathOrUrl) return;
  try {
    if (filePathOrUrl.startsWith('/uploads/administrative_files/') || filePathOrUrl.includes('administrative_files')) {
      const fileName = path.basename(filePathOrUrl);
      const fullPath = path.join(adminFilesDir, fileName);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err) {
    console.warn('Could not remove previous administrative file:', err.message);
  }
}

// 1. Generic Upload Endpoint for administrative documents
// POST /api/upload/administrative-file
router.post(
  '/administrative-file',
  optionalAuth,
  handleSingleUpload('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new HttpError(400, 'No file was provided for upload.');
    }

    const fileUrl = `/uploads/administrative_files/${req.file.filename}`;
    res.json({
      success: true,
      file_url: fileUrl,
      filename: req.file.originalname,
      stored_name: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  })
);

// 2. Direct Upload & Attach to a User (Student, Teacher, or Employee)
// POST /api/upload/user-administrative-file/:userId
router.post(
  '/user-administrative-file/:userId',
  optionalAuth,
  handleSingleUpload('file'),
  asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    if (!req.file) {
      throw new HttpError(400, 'No file was provided for upload.');
    }

    const [user] = await query('SELECT id, administrative_file FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!user) {
      safelyRemoveFile(req.file.filename);
      throw new HttpError(404, 'User not found.');
    }

    // Clean up old file to optimize disk space
    if (user.administrative_file) {
      safelyRemoveFile(user.administrative_file);
    }

    const fileUrl = `/uploads/administrative_files/${req.file.filename}`;
    await query('UPDATE users SET administrative_file = ? WHERE id = ?', [fileUrl, userId]);

    res.json({
      success: true,
      message: 'Administrative file uploaded and attached successfully.',
      file_url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      user_id: userId
    });
  })
);

// 3. Remove Administrative File for a User
// DELETE /api/upload/user-administrative-file/:userId
router.delete(
  '/user-administrative-file/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const [user] = await query('SELECT id, administrative_file FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!user) {
      throw new HttpError(404, 'User not found.');
    }

    if (user.administrative_file) {
      safelyRemoveFile(user.administrative_file);
      await query('UPDATE users SET administrative_file = NULL WHERE id = ?', [userId]);
    }

    res.json({ success: true, message: 'Administrative file removed successfully.' });
  })
);

// Map file extensions to MIME types
const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.rtf': 'application/rtf',
  '.txt': 'text/plain; charset=utf-8'
};

function resolveAdminFilePath(rawParam) {
  if (!rawParam) return null;
  const cleanParam = String(rawParam).split('?')[0];
  const fileName = path.basename(cleanParam);
  if (!fileName || fileName === '.' || fileName === '..') return null;
  const fullPath = path.join(adminFilesDir, fileName);
  // Guard against path traversal
  const guard = adminFilesDir + path.sep;
  if (!fullPath.startsWith(guard) && fullPath !== adminFilesDir) return null;
  if (!fs.existsSync(fullPath)) return null;
  return { fullPath, fileName };
}

// 4. View Document Inline (PDF in iframe, images inline)
// GET /api/upload/view?file=<filename or /uploads/... path>
router.get('/view', (req, res, next) => {
  const fileInfo = resolveAdminFilePath(req.query.file);
  if (!fileInfo) {
    return next(new HttpError(404, 'File not found.'));
  }
  const ext = path.extname(fileInfo.fileName).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(fileInfo.fullPath);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', "inline; filename*=UTF-8''" + encodeURIComponent(fileInfo.fileName));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const stream = fs.createReadStream(fileInfo.fullPath);
  stream.on('error', (err) => next(err));
  stream.pipe(res);
});

// 5. Force Download with proper filename and Content-Type
// GET /api/upload/download?file=<filename or path>&name=<optional display name>
router.get('/download', (req, res, next) => {
  const fileInfo = resolveAdminFilePath(req.query.file);
  if (!fileInfo) {
    return next(new HttpError(404, 'File not found.'));
  }
  const ext = path.extname(fileInfo.fileName).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(fileInfo.fullPath);
  let downloadName = req.query.name ? String(req.query.name).trim() : fileInfo.fileName;
  downloadName = path.basename(downloadName);
  if (!path.extname(downloadName)) {
    downloadName += ext;
  }
  const encoded = encodeURIComponent(downloadName);

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', "attachment; filename=\"" + encoded + "\"; filename*=UTF-8''" + encoded);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'no-store');

  const stream = fs.createReadStream(fileInfo.fullPath);
  stream.on('error', (err) => next(err));
  stream.pipe(res);
});

module.exports = router;
