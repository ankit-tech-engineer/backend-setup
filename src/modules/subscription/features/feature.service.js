const Feature = require('./feature.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

const createFeature = async (data) => {
    const existing = await Feature.findOne({ 
        $or: [{ name: data.name }, { code: data.code.toUpperCase() }],
        isDeleted: false
    });
    if (existing) throw new AppError('Feature name or code already exists', httpStatus.CONFLICT);

    return Feature.create(data);
};

const getFeatures = async (query = {}) => {
    const options = parseQueryOptions(query);
    const filter = { isDeleted: false, ...options.filter };

    const dbQuery = Feature.find(filter)
        .sort(options.sort)
        .skip(options.skip)
        .select(options.selectStr);
    
    if (!options.noLimit) dbQuery.limit(options.limit);

    const [list, total] = await Promise.all([
        dbQuery,
        Feature.countDocuments(filter),
    ]);

    return paginatedResponse(list, total, options);
};

const getFeatureById = async (id) => {
    const feature = await Feature.findOne({ id, isDeleted: false });
    if (!feature) throw new AppError('Feature not found', httpStatus.NOT_FOUND);
    return feature;
};

const updateFeature = async (id, data) => {
    if (data.code) data.code = data.code.toUpperCase();
    const feature = await Feature.findOneAndUpdate({ id, isDeleted: false }, data, { new: true });
    if (!feature) throw new AppError('Feature not found', httpStatus.NOT_FOUND);
    return feature;
};

const deleteFeature = async (id) => {
    const feature = await Feature.findOneAndUpdate({ id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!feature) throw new AppError('Feature not found', httpStatus.NOT_FOUND);
    return feature;
};

module.exports = {
    createFeature,
    getFeatures,
    getFeatureById,
    updateFeature,
    deleteFeature,
};
