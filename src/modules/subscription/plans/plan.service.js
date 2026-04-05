const Plan = require('./plan.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

const createPlan = async (data) => {
    const existing = await Plan.findOne({ name: data.name, isDeleted: false });
    if (existing) throw new AppError('Plan name already exists', httpStatus.CONFLICT);

    return Plan.create(data);
};

const getPlans = async (query = {}) => {
    const options = parseQueryOptions(query);
    const filter = { isDeleted: false, ...options.filter };

    const dbQuery = Plan.find(filter)
        .populate({ path: 'features', model: 'Feature', foreignField: 'id', select: 'id name code' })
        .sort(options.sort)
        .skip(options.skip)
        .select(options.selectStr);
    
    if (!options.noLimit) dbQuery.limit(options.limit);

    const [list, total] = await Promise.all([
        dbQuery,
        Plan.countDocuments(filter),
    ]);

    return paginatedResponse(list, total, options);
};

const getPlanById = async (id) => {
    const plan = await Plan.findOne({ id, isDeleted: false })
        .populate({ path: 'features', model: 'Feature', foreignField: 'id', select: 'id name code' });
    if (!plan) throw new AppError('Plan not found', httpStatus.NOT_FOUND);
    return plan;
};

const updatePlan = async (id, data) => {
    const plan = await Plan.findOneAndUpdate({ id, isDeleted: false }, data, { new: true });
    if (!plan) throw new AppError('Plan not found', httpStatus.NOT_FOUND);
    return plan;
};

const deletePlan = async (id) => {
    const plan = await Plan.findOneAndUpdate({ id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!plan) throw new AppError('Plan not found', httpStatus.NOT_FOUND);
    return plan;
};

module.exports = {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
};
