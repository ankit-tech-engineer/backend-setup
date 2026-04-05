require('dotenv').config();
const mongoose = require('mongoose');
const { env } = require('../src/config/env.config');
const Vendor = require('../src/modules/vendor/vendor.model');
const Permission = require('../src/modules/acl/permissions/permissions.model');
const { activateLogin } = require('../src/modules/vendor/vendor.service');

async function verify() {
    await mongoose.connect(env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Find a test vendor
    let vendor = await Vendor.findOne({ isDeleted: false });
    if (!vendor) {
        console.log('No vendor found. Creating one...');
        vendor = await Vendor.create({
            name: 'Test Vendor Permission',
            email: 'test_perm_' + Date.now() + '@example.com',
            tenantKey: 'TEST_PERM_' + Date.now(),
        });
    }

    // Reset its login activate status if needed
    vendor.isLoginActivate = false;
    await vendor.save();

    console.log(`Activating login for vendor: ${vendor.name} (Tenant: ${vendor.tenantKey})`);

    try {
        await activateLogin(vendor.id);
        console.log('Login activated successfully');

        // 2. Check permissions
        const perm = await Permission.findOne({ tenantKey: vendor.tenantKey, roleId: 2 });
        if (perm) {
            console.log('SUCCESS: Permission found for tenantKey!');
            console.log('Permissions count:', perm.permissions.length);
        } else {
            console.log('FAILURE: Permission NOT found for tenantKey');
        }
    } catch (error) {
        console.error('Error during activation:', error);
    } finally {
        await mongoose.connection.close();
    }
}

verify();
