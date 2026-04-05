const express = require('express');
const router = express.Router();
const mappingController = require('./resource-action-mapping.controller');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const validate = require('../../../core/middleware/validate.middleware');
const { createMappingSchema, updateMappingSchema } = require('./resource-action-mapping.validation');

router.use(authenticate);

// Global master data management - Super Admin only ideally, but following core pattern
router.get('/',      checkPermission('resource_action_mapping', 'list'),   mappingController.getAll);
router.get('/:id',   checkPermission('resource_action_mapping', 'read'),   mappingController.getById);
router.post('/',     checkPermission('resource_action_mapping', 'create'), validate(createMappingSchema), mappingController.create);
router.patch('/:id', checkPermission('resource_action_mapping', 'update'), validate(updateMappingSchema), mappingController.update);
router.delete('/:id',checkPermission('resource_action_mapping', 'delete'), mappingController.remove);

module.exports = router;
