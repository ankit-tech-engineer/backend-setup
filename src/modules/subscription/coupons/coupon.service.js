const Coupon = require('./coupon.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

const createCoupon = async (data) => {
    const existing = await Coupon.findOne({ code: data.code.toUpperCase(), isDeleted: false });
    if (existing) throw new AppError('Coupon code already exists', httpStatus.CONFLICT);

    return Coupon.create(data);
};

const getCoupons = async (query = {}) => {
    const options = parseQueryOptions(query);
    const filter = { isDeleted: false, ...options.filter };

    const dbQuery = Coupon.find(filter)
        .sort(options.sort)
        .skip(options.skip)
        .select(options.selectStr);
    
    if (!options.noLimit) dbQuery.limit(options.limit);

    const [list, total] = await Promise.all([
        dbQuery,
        Coupon.countDocuments(filter),
    ]);

    return paginatedResponse(list, total, options);
};

const getCouponById = async (id) => {
    const coupon = await Coupon.findOne({ id, isDeleted: false });
    if (!coupon) throw new AppError('Coupon not found', httpStatus.NOT_FOUND);
    return coupon;
};

const updateCoupon = async (id, data) => {
    if (data.code) data.code = data.code.toUpperCase();
    const coupon = await Coupon.findOneAndUpdate({ id, isDeleted: false }, data, { new: true });
    if (!coupon) throw new AppError('Coupon not found', httpStatus.NOT_FOUND);
    return coupon;
};

const deleteCoupon = async (id) => {
    const coupon = await Coupon.findOneAndUpdate({ id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!coupon) throw new AppError('Coupon not found', httpStatus.NOT_FOUND);
    return coupon;
};

const validateCoupon = async (code, amount) => {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), status: 'active', isDeleted: false });
    if (!coupon) throw new AppError('Invalid coupon code', httpStatus.BAD_REQUEST);

    if (new Date() > coupon.expiryDate) {
        throw new AppError('Coupon has expired', httpStatus.BAD_REQUEST);
    }

    if (coupon.usedCount >= coupon.usageLimit) {
        throw new AppError('Coupon usage limit reached', httpStatus.BAD_REQUEST);
    }

    if (amount < coupon.minPurchase) {
        throw new AppError(`Minimum purchase of ${coupon.minPurchase} required for this coupon`, httpStatus.BAD_REQUEST);
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discount = (amount * coupon.value) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount;
        }
    } else {
        discount = coupon.value;
    }

    return { coupon, discount };
};

module.exports = {
    createCoupon,
    getCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
};
