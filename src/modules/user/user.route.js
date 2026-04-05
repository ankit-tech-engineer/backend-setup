const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { checkPermission } = require('../../core/middleware/checkPermission.middleware');
const validate = require('../../core/middleware/validate.middleware');
const { createUserSchema, updateUserSchema } = require('./user.validation');

router.use(authenticate);

router.post('/',     checkPermission('user', 'create'), validate(createUserSchema), userController.createUser);
router.get('/',      checkPermission('user', 'list'),   userController.getAllUsers);
router.get('/:id',   checkPermission('user', 'read'),   userController.getUserById);
router.patch('/:id', checkPermission('user', 'update'), validate(updateUserSchema), userController.updateUser);
router.delete('/:id',checkPermission('user', 'delete'), userController.deleteUser);

router.post('/activate/:id',   checkPermission('user', 'activate'), userController.activate);
router.post('/deactivate/:id', checkPermission('user', 'deactivate'), userController.deactivate);

module.exports = router;
