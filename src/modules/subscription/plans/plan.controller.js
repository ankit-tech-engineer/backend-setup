const httpStatus = require('../../../constants/httpStatus');
const planService = require('./plan.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../core/response/responseHandler');

const createPlan = asyncHandler(async (req, res) => {
    const plan = await planService.createPlan(req.body);
    sendSuccess(res, {
        statusCode: httpStatus.CREATED,
        message: 'Plan created successfully',
        data: plan,
    });
});

const getPlans = asyncHandler(async (req, res) => {
    const result = await planService.getPlans(req.query);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Plans fetched successfully',
        data: result.data,
        meta: result.meta,
    });
});

const getPlanById = asyncHandler(async (req, res) => {
    const plan = await planService.getPlanById(req.params.id);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Plan fetched successfully',
        data: plan,
    });
});

const updatePlan = asyncHandler(async (req, res) => {
    const plan = await planService.updatePlan(req.params.id, req.body);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Plan updated successfully',
        data: plan,
    });
});

const deletePlan = asyncHandler(async (req, res) => {
    await planService.deletePlan(req.params.id);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Plan deleted successfully',
    });
});

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
};
