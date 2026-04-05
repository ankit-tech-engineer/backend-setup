const express = require('express');
const router = express.Router();
const vendorController = require('./vendor.controller');
const { checkPermission } = require('../../core/middleware/checkPermission.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');


const validate = require('../../core/middleware/validate.middleware');
const { createVendorSchema, updateVendorSchema } = require('./vendor.validation');

router.use(authenticate);

router.post('/', checkPermission('vendor', 'create'), validate(createVendorSchema), vendorController.createVendor);
router.get('/', checkPermission('vendor', 'read'), vendorController.getVendors);
router.get('/:id', checkPermission('vendor', 'read'), vendorController.getVendorById);
router.put('/:id', checkPermission('vendor', 'update'), validate(updateVendorSchema), vendorController.updateVendor);
router.delete('/:id', checkPermission('vendor', 'delete'), vendorController.deleteVendor);

router.post('/activate-login/:id', checkPermission('vendor', 'activate_login'), vendorController.activateLogin);
router.post('/deactivate-login/:id', checkPermission('vendor', 'deactivate_login'), vendorController.deactivateLogin);

module.exports = router;
