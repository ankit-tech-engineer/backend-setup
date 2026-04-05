const vendorService = require('./vendor.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../core/response/responseHandler');
const httpStatus = require('../../constants/httpStatus');

const createVendor = asyncHandler(async (req, res) => {
    const vendor = await vendorService.createVendor(req.body);
    sendSuccess(res, { statusCode: httpStatus.CREATED, message: 'Vendor created successfully', data: vendor });
});

const getVendors = asyncHandler(async (req, res) => {
    const { meta, data } = await vendorService.getVendors(req.query);
    sendSuccess(res, { meta, data });
});

const getVendorById = asyncHandler(async (req, res) => {
    const vendor = await vendorService.getVendorById(req.params.id);
    sendSuccess(res, { data: vendor });
});

const updateVendor = asyncHandler(async (req, res) => {
    const vendor = await vendorService.updateVendor(req.params.id, req.body);
    sendSuccess(res, { message: 'Vendor updated successfully', data: vendor });
});

const deleteVendor = asyncHandler(async (req, res) => {
    await vendorService.deleteVendor(req.params.id);
    sendSuccess(res, { message: 'Vendor deleted successfully' });
});

const activateLogin = asyncHandler(async (req, res) => {
    const vendor = await vendorService.activateLogin(req.params.id);
    sendSuccess(res, { message: 'Vendor login activated and credentials sent', data: vendor });
});

const deactivateLogin = asyncHandler(async (req, res) => {
    const vendor = await vendorService.deactivateLogin(req.params.id);
    sendSuccess(res, { message: 'Vendor login deactivated successfully', data: vendor });
});

module.exports = {
    createVendor,
    getVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
    activateLogin,
    deactivateLogin,
};
