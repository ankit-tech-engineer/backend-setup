const User = require('../modules/user/user.model');
const Role = require('../modules/acl/roles/roles.model');
const { STATUS, SUPER_ADMIN_KEY } = require('../constants/enums');
const logger = require('../utils/logger');

const seedSuperAdmin = async () => {
  try {
    // 1. Ensure Super Admin role exists
    let adminRole = await Role.findOne({ key: SUPER_ADMIN_KEY });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Super Admin',
        key: SUPER_ADMIN_KEY,
        tenantKey: null,
        status: STATUS.ACTIVE
      });
      logger.info('Super Admin role created');
    }

    // 2. Ensure Super Admin user exists
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        password: 'SecuredPassword@7512',
        roles: [adminRole.id], // Using numeric ID now
        tenantKey: null,
        isVerified: true,
        isActive: true,
        status: STATUS.ACTIVE
      });
      logger.info('Super Admin user created: admin@example.com / SecuredPassword@7512');
    } else {
      // Ensure existing admin has the correct role id
      if (!existingAdmin.roles.includes(adminRole.id)) {
        existingAdmin.roles.push(adminRole.id);
        await existingAdmin.save();
        logger.info('Super Admin user roles updated');
      }
    }
  } catch (error) {
    logger.error(`Error seeding Super Admin: ${error.message}`);
  }
};

module.exports = { seedSuperAdmin };
