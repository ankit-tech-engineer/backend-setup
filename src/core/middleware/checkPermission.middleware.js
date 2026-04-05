const User = require('../../modules/user/user.model');
const Permission = require('../../modules/acl/permissions/permissions.model');
const AppError = require('../error/AppError');
const httpStatus = require('../../constants/httpStatus');
const asyncHandler = require('../../utils/asyncHandler');
const { SUPER_ADMIN_KEY, STATUS } = require('../../constants/enums');

/**
 * checkPermission(resourceKey, actionKey)
 * Validates if the user has permission for a specific resource and action.
 * Optimized for nested Permission model structure.
 */
const checkPermission = (resourceKey, actionKey) =>
  asyncHandler(async (req, res, next) => {
    // 1. Get user with roles
    console.log("??>>>>>>>>",req.user);
    const user = await User.findOne({ id: req.user.id, isDeleted: false })
      .populate({ 
        path: 'roles', 
        model: 'Role', 
        foreignField: 'id', 
        match: { isDeleted: false, status: STATUS.ACTIVE } 
      })
      .select('roles tenantKey vendorId');

    if (!user) throw new AppError('User not found', httpStatus.UNAUTHORIZED);
    
    // 2. SUPER_ADMIN bypass
    const isSuperAdmin = user.tenantKey === null || user.roles.some((role) => role.key === SUPER_ADMIN_KEY);
    if (isSuperAdmin) return next();

    if (!user.roles.length) throw new AppError('User has no assigned roles', httpStatus.FORBIDDEN);

    const roleIds = user.roles.map((role) => role.id);

    // 3. Fetch permissions for the specific role(s)
    const permissionDocs = await Permission.find({
      roleId:      { $in: roleIds },
      tenantKey:   user.tenantKey,
      isDeleted:   false,
      status:      STATUS.ACTIVE,
    });

    // 4. Search within nested permissions array
    const hasPermission = permissionDocs.some((doc) => 
      doc.permissions.some((p) => 
        p.resource.toLowerCase() === resourceKey.toLowerCase() && 
        p.action.map(a => a.toLowerCase()).includes(actionKey.toLowerCase())
      )
    );

    if (!hasPermission) {
      throw new AppError(
        `Access denied: '${actionKey}' on '${resourceKey}' is not allowed`,
        httpStatus.FORBIDDEN
      );
    }

    next();
  });

module.exports = { checkPermission };
