const express = require('express');
const validate = require('../../../core/middleware/validate.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const couponValidation = require('./coupon.validation');
const couponController = require('./coupon.controller');

const router = express.Router();

router.use(authenticate);

router
    .route('/')
    .post(checkPermission('subscription_coupons', 'create'), validate(couponValidation.createCoupon), couponController.createCoupon)
    .get(checkPermission('subscription_coupons', 'list'), couponController.getCoupons);

router
    .route('/:id')
    .get(checkPermission('subscription_coupons', 'read'), couponController.getCouponById)
    .patch(checkPermission('subscription_coupons', 'update'), validate(couponValidation.updateCoupon), couponController.updateCoupon)
    .delete(checkPermission('subscription_coupons', 'delete'), couponController.deleteCoupon);

module.exports = router;
