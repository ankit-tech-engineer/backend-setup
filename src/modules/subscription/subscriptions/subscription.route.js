const express = require('express');
const validate = require('../../../core/middleware/validate.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const subscriptionValidation = require('./subscription.validation');
const subscriptionController = require('./subscription.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('subscriptions', 'list'), subscriptionController.getSubscriptions);
router.get('/active', subscriptionController.getActiveSubscription);
router.get('/history', checkPermission('subscriptions', 'list'), subscriptionController.getSubscriptionHistory);

router.post('/purchase', checkPermission('subscriptions', 'create'), validate(subscriptionValidation.purchasePlan), subscriptionController.purchasePlan);
router.post('/renew', checkPermission('subscriptions', 'update'), validate(subscriptionValidation.renewPlan), subscriptionController.renewPlan);
router.post('/upgrade', checkPermission('subscriptions', 'update'), validate(subscriptionValidation.upgradePlan), subscriptionController.upgradePlan);

module.exports = router;
