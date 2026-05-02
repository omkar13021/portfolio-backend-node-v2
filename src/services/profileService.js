import Profile from '../models/Profile.js';
import { NotFoundError, ConflictError } from '../utils/ApiError.js';
import { profileLogger } from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

// ── Get Profile ───────────────────────────────────────────────────────────────

export const getProfile = async (userId) => {
  const profile = await Profile.findOne({ user: userId });
  
  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  profileLogger.info(`Profile retrieved for user ${userId}`);
  return profile;
};

// ── Get or Create Profile ─────────────────────────────────────────────────────

export const getOrCreateProfile = async (userId) => {
  let profile = await Profile.findOne({ user: userId });

  if (!profile) {
    profile = await Profile.create({ user: userId });
    profileLogger.info(`New profile created for user ${userId}`);
  }

  return profile;
};

// ── Update Profile ────────────────────────────────────────────────────────────

export const updateProfile = async (userId, data) => {
  let profile = await Profile.findOne({ user: userId });

  if (!profile) {
    profile = await Profile.create({ user: userId, ...data });
    profileLogger.info(`Profile created for user ${userId}`);
    return profile;
  }

  // Update fields
  Object.assign(profile, data);
  await profile.save();

  profileLogger.info(`Profile updated for user ${userId}`);
  return profile;
};

// ── Upload Profile Photo ──────────────────────────────────────────────────────

export const uploadProfilePhoto = async (userId, file) => {
  if (!file) {
    throw new NotFoundError('No file uploaded');
  }

  let profile = await Profile.findOne({ user: userId });

  if (!profile) {
    profile = await Profile.create({ user: userId });
  }

  // Delete old photo if exists
  if (profile.profilePhoto) {
    try {
      const oldPhotoPath = path.join(process.cwd(), 'uploads', path.basename(profile.profilePhoto));
      await fs.unlink(oldPhotoPath);
      profileLogger.info(`Old profile photo deleted: ${oldPhotoPath}`);
    } catch (err) {
      profileLogger.warn(`Failed to delete old photo: ${err.message}`);
    }
  }

  // Save new photo URL
  profile.profilePhoto = `/uploads/${file.filename}`;
  await profile.save();

  profileLogger.info(`Profile photo uploaded for user ${userId}: ${file.filename}`);
  return profile;
};

// ── Upload Resume ─────────────────────────────────────────────────────────────

export const uploadResume = async (userId, file) => {
  if (!file) {
    throw new NotFoundError('No file uploaded');
  }

  let profile = await Profile.findOne({ user: userId });

  if (!profile) {
    profile = await Profile.create({ user: userId });
  }

  // Delete old resume if exists
  if (profile.resume?.url) {
    try {
      const oldResumePath = path.join(process.cwd(), 'uploads', path.basename(profile.resume.url));
      await fs.unlink(oldResumePath);
      profileLogger.info(`Old resume deleted: ${oldResumePath}`);
    } catch (err) {
      profileLogger.warn(`Failed to delete old resume: ${err.message}`);
    }
  }

  // Save new resume
  profile.resume = {
    url: `/uploads/${file.filename}`,
    filename: file.originalname,
    uploadedAt: new Date(),
  };
  await profile.save();

  profileLogger.info(`Resume uploaded for user ${userId}: ${file.filename}`);
  return profile;
};

// ── Delete Profile ────────────────────────────────────────────────────────────

export const deleteProfile = async (userId) => {
  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  // Delete associated files
  if (profile.profilePhoto) {
    try {
      const photoPath = path.join(process.cwd(), 'uploads', path.basename(profile.profilePhoto));
      await fs.unlink(photoPath);
    } catch (err) {
      profileLogger.warn(`Failed to delete profile photo: ${err.message}`);
    }
  }

  if (profile.resume?.url) {
    try {
      const resumePath = path.join(process.cwd(), 'uploads', path.basename(profile.resume.url));
      await fs.unlink(resumePath);
    } catch (err) {
      profileLogger.warn(`Failed to delete resume: ${err.message}`);
    }
  }

  await Profile.deleteOne({ _id: profile._id });
  profileLogger.info(`Profile deleted for user ${userId}`);
};

// ── Get Public Profile ────────────────────────────────────────────────────────

export const getPublicProfile = async (userId) => {
  const profile = await Profile.findOne({ user: userId, isPublic: true })
    .populate('user', 'name email');

  if (!profile) {
    throw new NotFoundError('Public profile not found');
  }

  await profile.incrementViews();
  return profile;
};
