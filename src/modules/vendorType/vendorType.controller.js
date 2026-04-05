const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../core/response/responseHandler');
const httpStatus = require('../../constants/httpStatus');
const vendorTypeService = require('./vendorType.service');

const createVendorType = asyncHandler(async (req, res) => {
    const vt = await vendorTypeService.createVendorType(req.body);
    sendSuccess(res, { statusCode: httpStatus.CREATED, message: 'Vendor type created successfully', data: vt });
});

const getVendorTypes = asyncHandler(async (req, res) => {
    const { meta, data } = await vendorTypeService.getVendorTypes(req.query);
    sendSuccess(res, { meta, data });
});

const getVendorTypeById = asyncHandler(async (req, res) => {
    const vt = await vendorTypeService.getVendorTypeById(req.params.id);
    sendSuccess(res, { data: vt });
});

const updateVendorType = asyncHandler(async (req, res) => {
    const vt = await vendorTypeService.updateVendorType(req.params.id, req.body);
    sendSuccess(res, { message: 'Vendor type updated successfully', data: vt });
});

const deleteVendorType = asyncHandler(async (req, res) => {
    await vendorTypeService.deleteVendorType(req.params.id);
    sendSuccess(res, { message: 'Vendor type deleted successfully' });
});

module.exports = {
    createVendorType,
    getVendorTypes,
    getVendorTypeById,
    updateVendorType,
    deleteVendorType,
};
