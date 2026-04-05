const express = require('express');
const router = express.Router();
const mappingController = require('./module-resource-mapping.controller');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const validate = require('../../../core/middleware/validate.middleware');
const { createMappingSchema, updateMappingSchema } = require('./module-resource-mapping.validation');

router.use(authenticate);

router.get('/',      checkPermission('module_resource_mapping', 'list'),   mappingController.getAll);
router.get('/:id',   checkPermission('module_resource_mapping', 'read'),   mappingController.getById);
router.post('/',     checkPermission('module_resource_mapping', 'create'), validate(createMappingSchema), mappingController.create);
router.patch('/:id', checkPermission('module_resource_mapping', 'update'), validate(updateMappingSchema), mappingController.update);
router.delete('/:id',checkPermission('module_resource_mapping', 'delete'), mappingController.remove);

module.exports = router;
