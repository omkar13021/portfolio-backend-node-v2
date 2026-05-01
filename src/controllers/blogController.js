import * as blogService from '../services/blogService.js';
import { sendSuccess, paginationMeta } from '../utils/ApiResponse.js';

export const getAllBlogs = async (req, res) => {
    const { blogs, total, page, limit } = await blogService.listBlogs(req.query, !!req.user);
    sendSuccess(res, {
        data: blogs,
        meta: paginationMeta({ total, page, limit, count: blogs.length }),
    });
};

export const getUserBlogs = async (req, res) => {
    const { blogs, total, page, limit } = await blogService.getUserBlogs(req.user._id, req.query);
    sendSuccess(res, {
        data: blogs,
        meta: paginationMeta({ total, page, limit, count: blogs.length }),
    });
};

export const getBlogById = async (req, res) => {
    const blog = await blogService.getBlog(req.params.id);
    sendSuccess(res, { data: blog });
};

export const createBlog = async (req, res) => {
    const blog = await blogService.createBlog(req.body, req.user._id);
    sendSuccess(res, { statusCode: 201, message: 'Blog created successfully', data: blog });
};

export const updateBlog = async (req, res) => {
    const blog = await blogService.updateBlog(req.params.id, req.body, req.user._id);
    sendSuccess(res, { message: 'Blog updated successfully', data: blog });
};

export const deleteBlog = async (req, res) => {
    await blogService.deleteBlog(req.params.id, req.user._id);
    sendSuccess(res, { message: 'Blog deleted successfully' });
};

export const restoreBlog = async (req, res) => {
    await blogService.restoreBlog(req.params.id, req.user._id);
    sendSuccess(res, { message: 'Blog restored successfully' });
};

export const likeBlog = async (req, res) => {
    const likes = await blogService.likeBlog(req.params.id);
    sendSuccess(res, { data: { likes } });
};

export const unlikeBlog = async (req, res) => {
    const likes = await blogService.unlikeBlog(req.params.id);
    sendSuccess(res, { data: { likes } });
};

export const publishScheduledBlogs = async (req, res) => {
    const blogs = await blogService.publishScheduled();
    sendSuccess(res, {
        message: `${blogs.length} scheduled blog(s) published`,
        data   : blogs,
        meta   : { count: blogs.length },
    });
};
