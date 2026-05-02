import * as contentService from '../services/contentService.js';
import { sendSuccess, paginationMeta } from '../utils/ApiResponse.js';

export const getContent = async (req, res) => {
    const { contentItems, total, page, limit } = await contentService.listContent(req.query, !!req.user);
    sendSuccess(res, {
        data: contentItems,
        meta: paginationMeta({ total, page, limit, count: contentItems.length }),
    });
};

export const getUserContent = async (req, res) => {
    const { contentItems, total, page, limit } = await contentService.getUserContent(req.user._id, req.query);
    sendSuccess(res, {
        data: contentItems,
        meta: paginationMeta({ total, page, limit, count: contentItems.length }),
    });
};

export const getContentById = async (req, res) => {
    const content = await contentService.getContent(req.params.id);
    sendSuccess(res, { data: content });
};

export const createContent = async (req, res) => {
    const content = await contentService.createContent(req.body, req.user._id);
    sendSuccess(res, { statusCode: 201, message: 'Content created successfully', data: content });
};

export const updateContent = async (req, res) => {
    const content = await contentService.updateContent(req.params.id, req.body, req.user._id);
    sendSuccess(res, { message: 'Content updated successfully', data: content });
};

export const deleteContent = async (req, res) => {
    await contentService.deleteContent(req.params.id, req.user._id);
    sendSuccess(res, { message: 'Content deleted successfully' });
};

export const restoreContent = async (req, res) => {
    await contentService.restoreContent(req.params.id, req.user._id);
    sendSuccess(res, { message: 'Content restored successfully' });
};

export const likeContent = async (req, res) => {
    const likes = await contentService.likeContent(req.params.id);
    sendSuccess(res, { data: { likes } });
};

export const unlikeContent = async (req, res) => {
    const likes = await contentService.unlikeContent(req.params.id);
    sendSuccess(res, { data: { likes } });
};

export const toggleFeatured = async (req, res) => {
    const featured = await contentService.toggleFeatured(req.params.id, req.user._id);
    sendSuccess(res, {
        message: `Content ${featured ? 'featured' : 'unfeatured'} successfully`,
        data   : { featured },
    });
};
