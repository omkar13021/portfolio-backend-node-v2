import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // ── Personal Information ──────────────────────────────────────────────────
    fullName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      city: String,
      state: String,
      country: String,
    },
    profilePhoto: {
      type: String, // URL to uploaded photo
    },

    // ── Professional Links ────────────────────────────────────────────────────
    linkedin: {
      type: String,
      trim: true,
    },
    github: {
      type: String,
      trim: true,
    },
    portfolio: {
      type: String,
      trim: true,
    },

    // ── Professional Summary ──────────────────────────────────────────────────
    summary: {
      type: String,
      maxlength: 2000,
    },

    // ── Skills ────────────────────────────────────────────────────────────────
    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    // ── Resume ────────────────────────────────────────────────────────────────
    resume: {
      url: String,
      filename: String,
      uploadedAt: Date,
    },

    // ── Education ─────────────────────────────────────────────────────────────
    education: [
      {
        school: {
          type: String,
          required: true,
          trim: true,
        },
        degree: {
          type: String,
          required: true,
          trim: true,
        },
        field: {
          type: String,
          trim: true,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
        current: {
          type: Boolean,
          default: false,
        },
        description: {
          type: String,
          maxlength: 500,
        },
      },
    ],

    // ── Experience ────────────────────────────────────────────────────────────
    experience: [
      {
        company: {
          type: String,
          required: true,
          trim: true,
        },
        position: {
          type: String,
          required: true,
          trim: true,
        },
        location: {
          type: String,
          trim: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
        },
        current: {
          type: Boolean,
          default: false,
        },
        description: {
          type: String,
          maxlength: 1000,
        },
      },
    ],

    // ── Projects ──────────────────────────────────────────────────────────────
    projects: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          maxlength: 500,
        },
        technologies: [
          {
            type: String,
            trim: true,
          },
        ],
        link: {
          type: String,
          trim: true,
        },
        github: {
          type: String,
          trim: true,
        },
        startDate: {
          type: Date,
        },
        endDate: {
          type: Date,
        },
      },
    ],

    // ── Certifications ────────────────────────────────────────────────────────
    certifications: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        issuer: {
          type: String,
          trim: true,
        },
        issueDate: {
          type: Date,
        },
        expiryDate: {
          type: Date,
        },
        credentialId: {
          type: String,
          trim: true,
        },
        credentialUrl: {
          type: String,
          trim: true,
        },
      },
    ],

    // ── Languages ─────────────────────────────────────────────────────────────
    languages: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'native'],
          default: 'intermediate',
        },
      },
    ],

    // ── Metadata ──────────────────────────────────────────────────────────────
    isPublic: {
      type: Boolean,
      default: false,
    },
    profileViews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

profileSchema.index({ user: 1 });
profileSchema.index({ skills: 1 });
profileSchema.index({ isPublic: 1 });

// ── Methods ───────────────────────────────────────────────────────────────────

profileSchema.methods.incrementViews = function () {
  this.profileViews += 1;
  return this.save();
};

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
