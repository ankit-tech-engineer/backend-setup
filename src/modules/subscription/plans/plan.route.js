const express = require('express');
const validate = require('../../../core/middleware/validate.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const planValidation = require('./plan.validation');
const planController = require('./plan.controller');

const router = express.Router();

router.use(authenticate);

router
    .route('/')
    .post(checkPermission('subscription_plans', 'create'), validate(planValidation.createPlan), planController.createPlan)
    .get(checkPermission('subscription_plans', 'list'), planController.getPlans);

router
    .route('/:id')
    .get(checkPermission('subscription_plans', 'read'), planController.getPlanById)
    .patch(checkPermission('subscription_plans', 'update'), validate(planValidation.updatePlan), planController.updatePlan)
    .delete(checkPermission('subscription_plans', 'delete'), planController.deletePlan);

module.exports = router;
