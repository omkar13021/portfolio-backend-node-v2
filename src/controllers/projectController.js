import * as projectService from '../services/projectService.js';
import { sendSuccess, paginationMeta } from '../utils/ApiResponse.js';

export const getProjects = async (req, res) => {
    const { projects, total, page, limit } = await projectService.listProjects(req.query, !!req.user);
    sendSuccess(res, {
        data: projects,
        meta: paginationMeta({ total, page, limit, count: projects.length }),
    });
};

export const getUserProjects = async (req, res) => {
    const { projects, total, page, limit } = await projectService.getUserProjects(req.user._id, req.query);
    sendSuccess(res, {
        data: projects,
        meta: paginationMeta({ total, page, limit, count: projects.length }),
    });
};

export const getProjectById = async (req, res) => {
    const project = await projectService.getProject(req.params.id);
    sendSuccess(res, { data: project });
};

export const createProject = async (req, res) => {
    const project = await projectService.createProject(req.body, req.user._id);
    sendSuccess(res, { statusCode: 201, message: 'Project created successfully', data: project });
};

export const updateProject = async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.body, req.user._id);
    sendSuccess(res, { message: 'Project updated successfully', data: project });
};

export const deleteProject = async (req, res) => {
    await projectService.deleteProject(req.params.id, req.user._id);
    sendSuccess(res, { message: 'Project deleted successfully' });
};

export const restoreProject = async (req, res) => {
    await projectService.restoreProject(req.params.id, req.user._id);
    sendSuccess(res, { message: 'Project restored successfully' });
};

export const likeProject = async (req, res) => {
    const likes = await projectService.likeProject(req.params.id);
    sendSuccess(res, { data: { likes } });
};

export const unlikeProject = async (req, res) => {
    const likes = await projectService.unlikeProject(req.params.id);
    sendSuccess(res, { data: { likes } });
};

export const toggleFeatured = async (req, res) => {
    const featured = await projectService.toggleFeatured(req.params.id, req.user._id);
    sendSuccess(res, {
        message: `Project ${featured ? 'featured' : 'unfeatured'} successfully`,
        data   : { featured },
    });
};
