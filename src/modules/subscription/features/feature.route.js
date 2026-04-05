const express = require('express');
const validate = require('../../../core/middleware/validate.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const featureValidation = require('./feature.validation');
const featureController = require('./feature.controller');

const router = express.Router();

router.use(authenticate);

router
    .route('/')
    .post(checkPermission('subscription_features', 'create'), validate(featureValidation.createFeature), featureController.createFeature)
    .get(checkPermission('subscription_features', 'list'), featureController.getFeatures);

router
    .route('/:id')
    .get(checkPermission('subscription_features', 'read'), featureController.getFeatureById)
    .patch(checkPermission('subscription_features', 'update'), validate(featureValidation.updateFeature), featureController.updateFeature)
    .delete(checkPermission('subscription_features', 'delete'), featureController.deleteFeature);

module.exports = router;
