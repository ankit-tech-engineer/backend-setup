const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.route');

const userRoutes = require('../modules/user/user.route');
const vendorRoutes = require('../modules/vendor/vendor.route');
const vendorTypeRoutes = require('../modules/vendorType/vendorType.route');

const roleRoutes = require('../modules/acl/roles/roles.route');
const permissionRoutes = require('../modules/acl/permissions/permissions.route');
const actionRoutes = require('../modules/acl/actions/actions.route');
const resourceRoutes = require('../modules/acl/resources/resources.route');
const mappingRoutes = require('../modules/acl/module-resource-mapping/module-resource-mapping.route');
const resourceActionMappingRoutes = require('../modules/acl/resource-action-mapping/resource-action-mapping.route');
const subscriptionRoutes = require('../modules/subscription/subscription.route');
const paymentRoutes = require('../modules/payment/payment.route');

router.get('/health', (req, res) => res.json({ success: true, message: 'Server is healthy' }));

// auth routes
router.use('/auth', authRoutes);

// users routes
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/vendor-types', vendorTypeRoutes);

// Subscription routes
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);

// ACL routes
router.use('/acl/roles', roleRoutes);
router.use('/acl/permissions', permissionRoutes);
router.use('/acl/actions', actionRoutes);
router.use('/acl/resources', resourceRoutes);
router.use('/acl/module-resource-mapping', mappingRoutes);
router.use('/acl/resource-action-mappings', resourceActionMappingRoutes);

module.exports = router;
