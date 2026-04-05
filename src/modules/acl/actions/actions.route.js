const express = require('express');
const router = express.Router();
const actionController = require('./actions.controller');
const { authenticate } = require('../../../core/middleware/auth.middleware');
const { checkPermission } = require('../../../core/middleware/checkPermission.middleware');
const validate = require('../../../core/middleware/validate.middleware');
const { createActionSchema, updateActionSchema } = require('./actions.validation');

router.use(authenticate);

router.get('/',      checkPermission('action', 'list'),   actionController.getAll);
router.get('/:id',   checkPermission('action', 'read'),   actionController.getById);
router.post('/',     checkPermission('action', 'create'),  validate(createActionSchema), actionController.create);
router.patch('/:id', checkPermission('action', 'update'),  validate(updateActionSchema), actionController.update);
router.delete('/:id',checkPermission('action', 'delete'),  actionController.remove);

module.exports = router;
