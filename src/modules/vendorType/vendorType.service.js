const VendorType = require('./vendorType.model');
const AppError = require('../../core/error/AppError');
const httpStatus = require('../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../utils/pagination');

const createVendorType = async (data) => {
    const existing = await VendorType.findOne({ 
        $or: [{ name: data.name }, { key: data.key }] 
    });
    if (existing) throw new AppError('Vendor type name or key already exists', httpStatus.CONFLICT);

    return VendorType.create(data);
};

const getVendorTypes = async (query = {}) => {
    const options = parseQueryOptions(query);
    const filter = { isDeleted: false, ...options.filter };

    const dbQuery = VendorType.find(filter)
        .sort(options.sort)
        .skip(options.skip)
        .select(options.selectStr);
    
    if (!options.noLimit) dbQuery.limit(options.limit);

    const [list, total] = await Promise.all([
        dbQuery,
        VendorType.countDocuments(filter),
    ]);

    return paginatedResponse(list, total, options);
};

const getVendorTypeById = async (id) => {
    const vt = await VendorType.findOne({ id, isDeleted: false });
    if (!vt) throw new AppError('Vendor type not found', httpStatus.NOT_FOUND);
    return vt;
};

const updateVendorType = async (id, data) => {
    const vt = await VendorType.findOneAndUpdate({ id, isDeleted: false }, data, { new: true });
    if (!vt) throw new AppError('Vendor type not found', httpStatus.NOT_FOUND);
    return vt;
};

const deleteVendorType = async (id) => {
    const vt = await VendorType.findOneAndUpdate({ id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!vt) throw new AppError('Vendor type not found', httpStatus.NOT_FOUND);
    return vt;
};

module.exports = {
    createVendorType,
    getVendorTypes,
    getVendorTypeById,
    updateVendorType,
    deleteVendorType,
};
