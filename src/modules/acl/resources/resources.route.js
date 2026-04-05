const express = require('express');
const router = express.Router();
const resourceController = require('./resources.controller');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const validate = require('../../../core/middleware/validate.middleware');
const { createResourceSchema, updateResourceSchema } = require('./resources.validation');

router.use(authenticate);

router.get('/',      checkPermission('resource', 'list'),   resourceController.getAll);
router.get('/:id',   checkPermission('resource', 'read'),   resourceController.getById);
router.post('/',     checkPermission('resource', 'create'),  validate(createResourceSchema), resourceController.create);
router.patch('/:id', checkPermission('resource', 'update'),  validate(updateResourceSchema), resourceController.update);
router.delete('/:id',checkPermission('resource', 'delete'),  resourceController.remove);

module.exports = router;
