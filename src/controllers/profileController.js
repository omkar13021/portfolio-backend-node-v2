import * as profileService from '../services/profileService.js';
import { sendSuccess } from '../utils/ApiResponse.js';

// ── Get Profile ───────────────────────────────────────────────────────────────

export const getProfile = async (req, res) => {
  const profile = await profileService.getOrCreateProfile(req.user._id);
  sendSuccess(res, profile, 'Profile retrieved successfully');
};

// ── Update Profile ────────────────────────────────────────────────────────────

export const updateProfile = async (req, res) => {
  const profile = await profileService.updateProfile(req.user._id, req.body);
  sendSuccess(res, profile, 'Profile updated successfully');
};

// ── Upload Profile Photo ──────────────────────────────────────────────────────

export const uploadPhoto = async (req, res) => {
  const profile = await profileService.uploadProfilePhoto(req.user._id, req.file);
  sendSuccess(res, profile, 'Profile photo uploaded successfully');
};

// ── Upload Resume ─────────────────────────────────────────────────────────────

export const uploadResume = async (req, res) => {
  const profile = await profileService.uploadResume(req.user._id, req.file);
  sendSuccess(res, profile, 'Resume uploaded successfully');
};

// ── Delete Profile ────────────────────────────────────────────────────────────

export const deleteProfile = async (req, res) => {
  await profileService.deleteProfile(req.user._id);
  sendSuccess(res, null, 'Profile deleted successfully');
};

// ── Get Public Profile ────────────────────────────────────────────────────────

export const getPublicProfile = async (req, res) => {
  const profile = await profileService.getPublicProfile(req.params.userId);
  sendSuccess(res, profile, 'Public profile retrieved successfully');
};
