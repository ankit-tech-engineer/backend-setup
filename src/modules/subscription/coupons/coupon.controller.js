const httpStatus = require('../../../constants/httpStatus');
const couponService = require('./coupon.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../core/response/responseHandler');

const createCoupon = asyncHandler(async (req, res) => {
    const coupon = await couponService.createCoupon(req.body);
    sendSuccess(res, {
        statusCode: httpStatus.CREATED,
        message: 'Coupon created successfully',
        data: coupon,
    });
});

const getCoupons = asyncHandler(async (req, res) => {
    const result = await couponService.getCoupons(req.query);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Coupons fetched successfully',
        data: result.data,
        meta: result.meta,
    });
});

const getCouponById = asyncHandler(async (req, res) => {
    const coupon = await couponService.getCouponById(req.params.id);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Coupon fetched successfully',
        data: coupon,
    });
});

const updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Coupon updated successfully',
        data: coupon,
    });
});

const deleteCoupon = asyncHandler(async (req, res) => {
    await couponService.deleteCoupon(req.params.id);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Coupon deleted successfully',
    });
});

module.exports = {
    createCoupon,
    getCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
};
