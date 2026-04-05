const express = require('express');
const router = express.Router();
const roleController = require('./roles.controller');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const validate = require('../../../core/middleware/validate.middleware');
const { createRoleSchema, updateRoleSchema } = require('./roles.validation');

router.use(authenticate);

router.get('/',      checkPermission('role', 'list'),   roleController.getAll);
router.get('/:id',   checkPermission('role', 'read'),   roleController.getById);
router.post('/',     checkPermission('role', 'create'),  validate(createRoleSchema), roleController.create);
router.patch('/:id', checkPermission('role', 'update'),  validate(updateRoleSchema), roleController.update);
router.delete('/:id',checkPermission('role', 'delete'),  roleController.remove);

module.exports = router;
