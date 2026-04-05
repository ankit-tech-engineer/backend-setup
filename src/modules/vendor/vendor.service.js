const crypto = require('crypto');
const Vendor = require('./vendor.model');
const User = require('../user/user.model');
const Role = require('../acl/roles/roles.model');
const RefreshToken = require('../auth/auth.refreshToken.model');
const AppError = require('../../core/error/AppError');
const httpStatus = require('../../constants/httpStatus');
const { STATUS } = require('../../constants/enums');
const { emailQueue } = require('../../queues/email.queue');
const { welcomeTemplate } = require('../../utils/emailTemplates');
const { parseQueryOptions, paginatedResponse } = require('../../utils/pagination');
const PermissionService = require('../acl/permissions/permissions.service');
const Resource = require('../acl/resources/resources.model');
const Action = require('../acl/actions/actions.model');
const ResourceActionMapping = require('../acl/resource-action-mapping/resource-action-mapping.model');

const createVendor = async (data) => {
    if (!data.tenantKey) {
        data.tenantKey = crypto.randomUUID();
    }
    const existing = await Vendor.findOne({ tenantKey: data.tenantKey });
    if (existing) throw new AppError('Account key already exists', httpStatus.CONFLICT);

    return Vendor.create(data);
};

const getVendors = async (query = {}) => {
    const options = parseQueryOptions(query);
    const filter = { isDeleted: false, ...options.filter };

    const dbQuery = Vendor.find(filter)
        .populate({ path: 'vendorType', model: 'VendorType', foreignField: 'id', select: 'id name key -_id' })
        .sort(options.sort)
        .skip(options.skip)
        .select(options.selectStr);
    
    if (!options.noLimit) dbQuery.limit(options.limit);

    const [vendors, total] = await Promise.all([
        dbQuery,
        Vendor.countDocuments(filter),
    ]);

    return paginatedResponse(vendors, total, options);
};

const getVendorById = async (id) => {
    const vendor = await Vendor.findOne({ id, isDeleted: false })
        .populate({ path: 'vendorType', model: 'VendorType', foreignField: 'id', select: 'id name key -_id' });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);
    return vendor;
};

const getVendorByTenantKey = async (tenantKey) => {
    const vendor = await Vendor.findOne({ tenantKey, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);
    return vendor;
};

const updateVendor = async (id, data) => {
    const vendor = await Vendor.findOneAndUpdate({ id, isDeleted: false }, data, { new: true });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);
    return vendor;
};

const deleteVendor = async (id) => {
    const vendor = await Vendor.findOneAndUpdate({ id, isDeleted: false }, { isDeleted: true }, { new: true });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);
    return vendor;
};

const activateLogin = async (id) => {
    const vendor = await Vendor.findOne({ id, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    if (vendor.isLoginActivate) {
        throw new AppError('Login is already activated for this vendor', httpStatus.BAD_REQUEST);
    }

    // 1. Generate random password
    const password = crypto.randomBytes(8).toString('hex');

    // 2. Locate or Create User
    let user = await User.findOne({ email: vendor.email });

    // 2.1 Ensure default Admin Role exists for this tenant
    let adminRole = await Role.findOne({ key: 'admin', tenantKey: vendor.tenantKey, isDeleted: false });
    if (!adminRole) {
        adminRole = await Role.create({
            name: 'Admin',
            key: 'admin',
            tenantKey: vendor.tenantKey,
            status: STATUS.ACTIVE
        });
    }

    if (user) {
        // If user already exists, just reactivate their account
        user.isActive = true;
        user.isVerified = true;
        user.password = password;
        user.vendorId = vendor.id;
        user.tenantKey = vendor.tenantKey;
        // Ensure user has the admin role
        if (!user.roles.includes(adminRole.id)) {
            user.roles.push(adminRole.id);
        }
        await user.save();

        vendor.userId = user.id;
        vendor.isLoginActivate = true;
    } else {
        // Create new user
        user = await User.create({
            name: vendor.name,
            email: vendor.email,
            password: password,
            tenantKey: vendor.tenantKey,
            vendorId: vendor.id,
            roles: [adminRole.id],
            isVerified: true,
            isActive: true,
        });

        // Initialize activation state
        vendor.userId = user.id;
        vendor.isLoginActivate = true;
        vendor.onTrial = true;
    }

    await vendor.save();

    // 3. Create/Seed permissions using Global Resource-Action Mappings
    const mappings = await ResourceActionMapping.find({ isDeleted: false, status: STATUS.ACTIVE })
        .populate({ path: 'resourceId', model: 'Resource', foreignField: 'id' })
        .populate({ path: 'actions', model: 'Action', foreignField: 'id' });

    const seededPermissions = mappings.map(m => ({
        resource: m.resourceId.key,
        action:   m.actions.map(a => a.key),
    }));

    if (seededPermissions.length > 0) {
        await PermissionService.create({
            roleId: adminRole.id,
            permissions: seededPermissions,
        }, vendor.tenantKey);
    }
    
    // 4. Send Email
    await emailQueue.add('welcome', {
        to: vendor.email,
        subject: 'Your Vendor Account is Active!',
        html: welcomeTemplate(vendor.name, vendor.email, password),
    });

    return vendor;
};

const deactivateLogin = async (id) => {
    const vendor = await Vendor.findOne({ id, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    if (!vendor.isLoginActivate) {
        throw new AppError('Login is already deactivated for this vendor', httpStatus.BAD_REQUEST);
    }

    // 1. Update Vendor Status
    vendor.isLoginActivate = false;
    await vendor.save();

    // 2. Locate and Deactivate User
    if (vendor.userId) {
        const user = await User.findOne({ id: vendor.userId, isDeleted: false });
        if (user) {
            user.isActive = false;
            await user.save();

            // 3. Revoke all refresh tokens for this user
            await RefreshToken.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });
        }
    }

    return vendor;
};

module.exports = {
    createVendor,
    getVendors,
    getVendorById,
    getVendorByTenantKey,
    updateVendor,
    deleteVendor,
    activateLogin,
    deactivateLogin,
};
