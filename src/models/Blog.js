import mongoose from "mongoose";
import slugify from 'slugify';

const schema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    content: [
        {
            type: {
                type: String,
                enum: ["paragraph", "heading", "image", "quote", "list", "code"],
                required: true,
            },
            data: {
                type: mongoose.Schema.Types.Mixed,
                required: true,
                validate: {
                    validator: function(data) {
                        const blockType = this.type;
                        switch(blockType) {
                            case 'paragraph':
                                return typeof data.text === 'string' && data.text.length > 0;
                            case 'heading':
                                return typeof data.text === 'string' && data.text.length > 0 && [1, 2, 3, 4, 5, 6].includes(data.level);
                            case 'image':
                                return typeof data.src === 'string' && data.src.length > 0;
                            case 'quote':
                                return typeof data.text === 'string' && data.text.length > 0;
                            case 'list':
                                return Array.isArray(data.items) && data.items.length > 0;
                            case 'code':
                                return typeof data.code === 'string' && data.code.length > 0;
                            default:
                                return false;
                        }
                    },
                    message: 'Invalid data for the specified block type'
                }
            },
        },
    ],
    excerpt: {
        type: String,
        maxlength: 500,
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    featuredImage: {
        type: String
    },
    tags: [{
        type: String,
        trim: true
    }],
    category: {
        // Backward compatible: accepts both string and object
        type: mongoose.Schema.Types.Mixed,
        validate: {
            validator: function(value) {
                if (typeof value === 'string') return value.trim().length > 0;
                if (typeof value === 'object' && value !== null) {
                    return typeof value.name === 'string' && value.name.trim().length > 0;
                }
                return false;
            },
            message: 'Category must be a non-empty string or object with name property'
        }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'scheduled', 'archived'],
        default: 'draft'
    },
    publishedAt: {
        type: Date
    },
    scheduledAt: {
        type: Date,
        validate: {
            validator: function(date) {
                return this.status !== 'scheduled' || date > new Date();
            },
            message: 'Scheduled date must be in the future for scheduled posts'
        }
    },
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    metaTitle: {
        type: String,
        maxlength: 60
    },
    metaDescription: {
        type: String,
        maxlength: 160
    },
    readingTime: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    }
}, { timestamps: true });

// Performance indexes
schema.index({ slug: 1 });
schema.index({ author: 1 });
schema.index({ status: 1 });
schema.index({ publishedAt: -1 });
schema.index({ tags: 1 });
schema.index({ isDeleted: 1 });

// Compound index for efficient blog listing (published first)
schema.index({ status: 1, publishedAt: -1 });

// Full-text search index for title and excerpt
schema.index({ title: 'text', excerpt: 'text' });

// Index for scheduled posts
schema.index({ status: 1, scheduledAt: 1 });

// Auto-generate slug from title if not provided
schema.pre('validate', function(next) {
    if (this.isModified('title') && (!this.slug || this.slug === '')) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        });
    }
    next();
});

// Calculate reading time and handle status changes
schema.pre('save', function (next) {
    // Set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }

    // Calculate reading time from paragraph content
    if (this.isModified('content')) {
        const textContent = this.content
            .filter(block => block.type === 'paragraph')
            .map(block => block.data.text || '')
            .join(' ');
        
        const words = textContent.split(/\s+/).filter(word => word.length > 0).length;
        // Average reading speed: 200 words per minute
        this.readingTime = Math.ceil(words / 200) || 1;
    }

    next();
});

// Static method for atomic view increment
schema.statics.incrementViews = function(blogId) {
    return this.findByIdAndUpdate(
        blogId,
        { $inc: { views: 1 } },
        { new: true }
    );
};

// Static method for atomic like increment
schema.statics.incrementLikes = function(blogId) {
    return this.findByIdAndUpdate(
        blogId,
        { $inc: { likes: 1 } },
        { new: true }
    );
};

// Static method for atomic like decrement
schema.statics.decrementLikes = function(blogId) {
    return this.findByIdAndUpdate(
        blogId,
        { $inc: { likes: -1 } },
        { new: true, min: 0 }
    );
};

// Static method for soft delete
schema.statics.softDelete = function(blogId) {
    return this.findByIdAndUpdate(
        blogId,
        { isDeleted: true, status: 'archived' },
        { new: true }
    );
};

// Static method to restore soft-deleted blog
schema.statics.restore = function(blogId) {
    return this.findByIdAndUpdate(
        blogId,
        { isDeleted: false },
        { new: true }
    );
};

// Query helper to exclude soft-deleted documents
schema.query.notDeleted = function() {
    return this.where({ isDeleted: false });
};

// Query helper to get published blogs
schema.query.published = function() {
    return this.where({ status: 'published', isDeleted: false });
};

// Query helper to get scheduled blogs ready for publishing
schema.query.scheduledReady = function() {
    return this.where({ 
        status: 'scheduled', 
        scheduledAt: { $lte: new Date() },
        isDeleted: false 
    });
};

const Blog = mongoose.model('Blog', schema);

export default Blog;
