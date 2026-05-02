import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { BadRequestError } from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Storage Configuration ─────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// ── File Filters ──────────────────────────────────────────────────────────────

const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only JPG, PNG, and GIF images are allowed'), false);
  }
};

const resumeFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

// ── Multer Instances ──────────────────────────────────────────────────────────

export const uploadPhoto = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
}).single('photo');

export const uploadResume = multer({
  storage,
  fileFilter: resumeFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).single('resume');

// ── Error Handler Wrapper ─────────────────────────────────────────────────────

export const handleUploadError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new BadRequestError('File size exceeds the allowed limit'));
      }
      return next(new BadRequestError(err.message));
    }
    if (err) {
      return next(err);
    }
    next();
  });
};
