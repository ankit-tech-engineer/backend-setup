const mongoose = require('mongoose');
const { env } = require('../src/config/env.config');
const vendorService = require('../src/modules/vendor/vendor.service');
const Vendor = require('../src/modules/vendor/vendor.model');
const Permission = require('../src/modules/acl/permissions/permissions.model');
const Role = require('../src/modules/acl/roles/roles.model');

async function run() {
    console.log(`Connecting to: ${env.MONGO_URI}...`);
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('Connected.');

        // 1. Create a fresh vendor for testing
        const email = `mapped_test_${Date.now()}@example.com`;
        const vendor = await Vendor.create({
            name: 'Mapped Test Vendor',
            email: email,
            tenantKey: `tenant_${Date.now()}`
        });

        console.log(`Activating login for: ${email}...`);
        await vendorService.activateLogin(vendor.id);

        // 2. Fetch the created permissions
        const adminRole = await Role.findOne({ key: 'admin', tenantKey: vendor.tenantKey });
        const perms = await Permission.findOne({ roleId: adminRole.id, tenantKey: vendor.tenantKey });

        console.log('--- Permission Results ---');
        for (const p of perms.permissions) {
            console.log(`Resource: ${p.resource}`);
            console.log(`Actions:  ${p.action.join(', ')}`);
            console.log('-------------------------');
        }

        // 3. Assertions (Visual check in log)
        const userPerm = perms.permissions.find(p => p.resource === 'user');
        if (userPerm) {
            const hasActivateLogin = userPerm.action.includes('activate_login');
            console.log(`User resource has 'activate_login': ${hasActivateLogin} (Expected: false)`);
            const hasActivate = userPerm.action.includes('activate');
            console.log(`User resource has 'activate': ${hasActivate} (Expected: true)`);
        }

    } catch (err) {
        console.error('❌ Error during verification:', err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
