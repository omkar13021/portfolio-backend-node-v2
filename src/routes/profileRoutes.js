import express from 'express';
import * as profileController from '../controllers/profileController.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/profileValidator.js';
import { uploadPhoto, uploadResume, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// ── Authenticated Routes ──────────────────────────────────────────────────────

router.get(
  '/',
  authenticate,
  profileController.getProfile
);

router.put(
  '/',
  authenticate,
  validate(updateProfileSchema),
  profileController.updateProfile
);

router.post(
  '/photo',
  authenticate,
  handleUploadError(uploadPhoto),
  profileController.uploadPhoto
);

router.post(
  '/resume',
  authenticate,
  handleUploadError(uploadResume),
  profileController.uploadResume
);

router.delete(
  '/',
  authenticate,
  profileController.deleteProfile
);

// ── Public Routes ─────────────────────────────────────────────────────────────

router.get(
  '/public/:userId',
  profileController.getPublicProfile
);

export default router;
