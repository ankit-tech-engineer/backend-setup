const express = require('express');
const vendorTypeController = require('./vendorType.controller');
const validate = require('../../core/middleware/validate.middleware');
const { createVendorTypeSchema, updateVendorTypeSchema } = require('./vendorType.validation');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { checkPermission } = require('../../core/middleware/checkPermission.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/', checkPermission('vendor_type', 'list'), vendorTypeController.getVendorTypes);
router.post('/', checkPermission('vendor_type', 'create'), validate(createVendorTypeSchema), vendorTypeController.createVendorType);
router.get('/:id', checkPermission('vendor_type', 'read'), vendorTypeController.getVendorTypeById);
router.put('/:id', checkPermission('vendor_type', 'update'), validate(updateVendorTypeSchema), vendorTypeController.updateVendorType);
router.delete('/:id', checkPermission('vendor_type', 'delete'), vendorTypeController.deleteVendorType);

module.exports = router;
