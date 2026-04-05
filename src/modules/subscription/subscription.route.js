const express = require('express');
const router = express.Router();

const featureRoutes = require('./features/feature.route');
const planRoutes = require('./plans/plan.route');
const couponRoutes = require('./coupons/coupon.route');
const subscriptionRoutes = require('./subscriptions/subscription.route');

router.use('/features', featureRoutes);
router.use('/plans', planRoutes);
router.use('/coupons', couponRoutes);
router.use('/', subscriptionRoutes);

module.exports = router;
