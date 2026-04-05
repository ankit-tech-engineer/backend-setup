const express = require('express');
const router = express.Router();
const permissionController = require('./permissions.controller');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const validate = require('../../../core/middleware/validate.middleware');
const { createPermissionSchema, updatePermissionSchema } = require('./permissions.validation');

router.use(authenticate);

router.get('/',      checkPermission('permission', 'list'),   permissionController.getAll);
router.get('/:id',   checkPermission('permission', 'read'),   permissionController.getById);
router.post('/',     checkPermission('permission', 'create'),  validate(createPermissionSchema), permissionController.create);
router.patch('/:id', checkPermission('permission', 'update'),  validate(updatePermissionSchema), permissionController.update);
router.delete('/:id',checkPermission('permission', 'delete'),  permissionController.remove);

module.exports = router;
