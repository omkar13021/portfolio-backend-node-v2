import mongoose from 'mongoose';
import slugify from 'slugify';

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true
    },
    description: {
        type: String
    },
    fullDescription: {
        type: String
    },
    category: {
        type: String,
        enum: ['Web Development', 'Mobile App', 'UI/UX Design', 'Data Science', 'Machine Learning', 'DevOps', 'Other'],
        default: 'Web Development'
    },
    technologies: [{
        type: String,
        trim: true
    }],
    images: [{
        url: {
            type: String
        },
        alt: String,
        caption: String
    }],
    thumbnailImage: {
        type: String
    },
    demoUrl: {
        type: String
    },
    githubUrl: {
        type: String
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
        index: true
    },
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    client: {
        name: String,
        company: String,
        testimonial: String
    },
    teamSize: {
        type: Number
    },
    role: {
        type: String
    },
    challenges: [{
        type: String
    }],
    solutions: [{
        type: String
    }],
    results: [{
        metric: String,
        value: String
    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    metaTitle: {
        type: String
    },
    metaDescription: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    publishedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for performance
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });
projectSchema.index({ status: 1, featured: -1, publishedAt: -1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ author: 1, status: 1 });

// Virtual for duration
projectSchema.virtual('duration').get(function() {
    if (this.startDate && this.endDate) {
        const months = Math.round((this.endDate - this.startDate) / (1000 * 60 * 60 * 24 * 30));
        return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : 'Less than a month';
    }
    return null;
});

// Pre-validate hook for auto-slug generation
projectSchema.pre('validate', function(next) {
    if (this.title && !this.slug) {
        this.slug = slugify(this.title, { lower: true, strict: true });
    }
    next();
});

// Pre-save hook
projectSchema.pre('save', function(next) {
    // Set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    
    // Clear publishedAt if status changes from published
    if (this.isModified('status') && this.status !== 'published') {
        this.publishedAt = null;
    }
    
    next();
});

// Static methods for atomic updates
projectSchema.statics.incrementViews = async function(projectId) {
    return await this.findByIdAndUpdate(
        projectId,
        { $inc: { views: 1 } },
        { new: true }
    );
};

projectSchema.statics.incrementLikes = async function(projectId) {
    return await this.findByIdAndUpdate(
        projectId,
        { $inc: { likes: 1 } },
        { new: true }
    );
};

projectSchema.statics.decrementLikes = async function(projectId) {
    return await this.findByIdAndUpdate(
        projectId,
        { $inc: { likes: -1 } },
        { new: true }
    );
};

projectSchema.statics.softDelete = async function(projectId) {
    return await this.findByIdAndUpdate(
        projectId,
        { isDeleted: true },
        { new: true }
    );
};

projectSchema.statics.restore = async function(projectId) {
    return await this.findByIdAndUpdate(
        projectId,
        { isDeleted: false },
        { new: true }
    );
};

// Query helpers
projectSchema.query.published = function() {
    return this.where({ status: 'published', isDeleted: false });
};

projectSchema.query.featured = function() {
    return this.where({ featured: true, isDeleted: false });
};

projectSchema.query.byCategory = function(category) {
    return this.where({ category, isDeleted: false });
};

projectSchema.query.byAuthor = function(authorId) {
    return this.where({ author: authorId, isDeleted: false });
};

const Project = mongoose.model('Project', projectSchema);

export default Project;
