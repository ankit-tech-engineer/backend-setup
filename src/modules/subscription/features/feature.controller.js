const httpStatus = require('../../../constants/httpStatus');
const featureService = require('./feature.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../core/response/responseHandler');

const createFeature = asyncHandler(async (req, res) => {
    const feature = await featureService.createFeature(req.body);
    sendSuccess(res, {
        statusCode: httpStatus.CREATED,
        message: 'Feature created successfully',
        data: feature,
    });
});

const getFeatures = asyncHandler(async (req, res) => {
    const result = await featureService.getFeatures(req.query);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Features fetched successfully',
        data: result.data,
        meta: result.meta,
    });
});

const getFeatureById = asyncHandler(async (req, res) => {
    const feature = await featureService.getFeatureById(req.params.id);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Feature fetched successfully',
        data: feature,
    });
});

const updateFeature = asyncHandler(async (req, res) => {
    const feature = await featureService.updateFeature(req.params.id, req.body);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Feature updated successfully',
        data: feature,
    });
});

const deleteFeature = asyncHandler(async (req, res) => {
    await featureService.deleteFeature(req.params.id);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Feature deleted successfully',
    });
});

module.exports = {
    createFeature,
    getFeatures,
    getFeatureById,
    updateFeature,
    deleteFeature,
};
