const mongoose = require('mongoose');
const { env } = require('../src/config/env.config');
const Resource = require('../src/modules/acl/resources/resources.model');
const Action = require('../src/modules/acl/actions/actions.model');
const ResourceActionMapping = require('../src/modules/acl/resource-action-mapping/resource-action-mapping.model');

async function run() {
    console.log(`Connecting to: ${env.MONGO_URI}...`);
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('Connected.');

        // 1. Fetch all resources and actions
        const resources = await Resource.find({ isDeleted: false });
        const actions = await Action.find({ isDeleted: false });

        console.log(`Found ${resources.length} resources and ${actions.length} actions.`);

        // 2. Identify Core Actions
        const coreActions = actions.filter(a => ['list', 'read', 'create', 'update', 'delete'].includes(a.key)).map(a => a.id);
        const specializedActions = actions.filter(a => ['activate', 'deactivate', 'activate_login', 'deactivate_login'].includes(a.key));

        console.log(`Core actions: ${coreActions.length}`);
        console.log(`Specialized actions: ${specializedActions.length}`);

        // 3. Clear existing mappings (optional for bootstrap)
        await ResourceActionMapping.deleteMany({});
        console.log('Cleared existing mappings.');

        // 4. Map Resources
        const mappings = [];

        const Counter = require('../src/core/models/counter.model');
        for (const res of resources) {
            let resActions = [...coreActions];

            // Add specialized actions based on resource key
            if (res.key === 'user' || res.key === 'vendor') {
                const spec = specializedActions.filter(a => ['activate', 'deactivate'].includes(a.key)).map(a => a.id);
                resActions.push(...spec);
            }

            if (res.key === 'vendor') {
                const spec = specializedActions.filter(a => ['activate_login', 'deactivate_login'].includes(a.key)).map(a => a.id);
                resActions = [...new Set([...resActions, ...spec])];
            }

            const id = await Counter.getNextId('resource_action_mappings');
            mappings.push({
                id,
                resourceId: res.id,
                actions: resActions,
                status: 'active'
            });
        }

        if (mappings.length > 0) {
            await ResourceActionMapping.insertMany(mappings);
            console.log(`✅ Successfully seeded ${mappings.length} resource-action mappings.`);
        } else {
            console.log('⚠️ No mappings to seed.');
        }

    } catch (err) {
        console.error('❌ Error during bootstrapping:', err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
