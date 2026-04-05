const mongoose = require('mongoose');
const Action = require('../src/modules/acl/actions/actions.model');
const Resource = require('../src/modules/acl/resources/resources.model');
const Role = require('../src/modules/acl/roles/roles.model');
const Permission = require('../src/modules/acl/permissions/permissions.model');
const vendorService = require('../src/modules/vendor/vendor.service');
const Vendor = require('../src/modules/vendor/vendor.model');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/saas-framework');
    console.log('--- Hybrid ACL Verification ---');

    try {
        // 1. Check Global Actions/Resources
        let testAction = await Action.findOne({ key: 'global_test_action' });
        if (!testAction) {
            testAction = await Action.create({ name: 'Global Test Action', key: 'global_test_action' });
            console.log('✅ Created Global Action');
        }

        let testResource = await Resource.findOne({ key: 'global_test_resource' });
        if (!testResource) {
            testResource = await Resource.create({ name: 'Global Test Resource', key: 'global_test_resource' });
            console.log('✅ Created Global Resource');
        }

        const action = await Action.findOne({ key: 'global_test_action' });
        console.log('Action tenantKey:', action.tenantKey); // Should be undefined

        // 2. Check Tenant Roles
        const tenantA = 'tenant_a_123';
        const roleA = await Role.findOne({ key: 'admin', tenantKey: tenantA });
        if (!roleA) {
            await Role.create({ name: 'Admin', key: 'admin', tenantKey: tenantA });
            console.log('✅ Created Role for Tenant A');
        }

        const tenantB = 'tenant_b_456';
        const roleB = await Role.findOne({ key: 'admin', tenantKey: tenantB });
        if (!roleB) {
            await Role.create({ name: 'Admin', key: 'admin', tenantKey: tenantB });
            console.log('✅ Created Role for Tenant B');
        }

        const allRoles = await Role.find({ key: 'admin' });
        console.log('Number of Admin roles:', allRoles.length); // Should be >= 2

        // 3. Verify Vendor Activation Seeding
        const testVendor = await Vendor.findOne({ email: 'hybrid_test@example.com' });
        if (testVendor) await Vendor.deleteOne({ email: 'hybrid_test@example.com' });

        const vendor = await Vendor.create({
            name: 'Hybrid Test Vendor',
            email: 'hybrid_test@example.com',
            tenantKey: 'hybrid_tenant_xyz'
        });

        console.log('Activating login for hybrid vendor...');
        const resCount = await Resource.countDocuments({ isDeleted: false, status: 'active' });
        const actCount = await Action.countDocuments({ isDeleted: false, status: 'active' });
        console.log(`Debug: Resources: ${resCount}, Actions: ${actCount}`);

        await vendorService.activateLogin(vendor.id);

        const hybridRole = await Role.findOne({ key: 'admin', tenantKey: 'hybrid_tenant_xyz' });
        console.log('✅ Hybrid Role created:', hybridRole ? 'Yes' : 'No');

        const permissions = await Permission.findOne({ roleId: hybridRole.id, tenantKey: 'hybrid_tenant_xyz' });
        console.log('✅ Hybrid Permissions seeded:', permissions ? 'Yes' : 'No');
        console.log('Permission count:', permissions.permissions.length);

    } catch (err) {
        console.error('❌ Error during verification:', err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
