const mongoose = require('mongoose');
const { env } = require('../src/config/env.config');
const Resource = require('../src/modules/acl/resources/resources.model');
const Action = require('../src/modules/acl/actions/actions.model');
const Permission = require('../src/modules/acl/permissions/permissions.model');
const Role = require('../src/modules/acl/roles/roles.model');

async function run() {
    console.log(`Connecting to: ${env.MONGO_URI}...`);
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('Connected.');

        // 1. Ensure 'module_resource_mapping' resource exists
        let res = await Resource.findOne({ key: 'module_resource_mapping' });
        if (!res) {
            res = await Resource.create({
                name: 'Module Resource Mapping',
                key: 'module_resource_mapping',
                status: 'active'
            });
            console.log('✅ Created Resource: module_resource_mapping');
        } else {
            console.log('ℹ️ Resource: module_resource_mapping already exists');
        }

        // 2. We need to update existing permissions for all 'admin' roles to include this
        const adminRoles = await Role.find({ key: 'admin', isDeleted: false });
        console.log(`Found ${adminRoles.length} admin roles to update.`);

        const allActions = await Action.find({ isDeleted: false, status: 'active' });
        const actionKeys = allActions.map(a => a.key);

        for (const role of adminRoles) {
            let permDoc = await Permission.findOne({ roleId: role.id, tenantKey: role.tenantKey, isDeleted: false });
            if (permDoc) {
                // Check if module_resource_mapping is already there
                const existing = permDoc.permissions.find(p => p.resource === 'module_resource_mapping');
                if (!existing) {
                    permDoc.permissions.push({
                        resource: 'module_resource_mapping',
                        action: actionKeys
                    });
                    await permDoc.save();
                    console.log(`✅ Updated permissions for Tenant: ${role.tenantKey}`);
                }
            }
        }

    } catch (err) {
        console.error('❌ Error during seeding:', err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
