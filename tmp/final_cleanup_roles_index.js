const mongoose = require('mongoose');
const { env } = require('../src/config/env.config');

async function run() {
    console.log(`Connecting to: ${env.MONGO_URI}...`);
    try {
        await mongoose.connect(env.MONGO_URI);
        console.log('Cleanup: Connected to MongoDB.');

        const collection = mongoose.connection.collection('roles');
        
        // List all indexes to be sure
        const indexes = await collection.indexes();
        console.log('Existing indexes:', JSON.stringify(indexes, null, 2));

        // 1. Drop the old single-field unique index
        // The error says "index: key_1"
        try {
            await collection.dropIndex('key_1');
            console.log('✅ Dropped key_1 index');
        } catch (e) {
            console.log('ℹ️ key_1 index not found or already dropped. Error:', e.message);
        }

        // 2. Refresh the compound index if needed
        // Mongoose will do this normally, but we can call createIndexes
        // await collection.createIndex({ key: 1, tenantKey: 1 }, { unique: true });
        // console.log('✅ Compound index created/verified');

    } catch (err) {
        console.error('❌ Error during cleanup:', err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
