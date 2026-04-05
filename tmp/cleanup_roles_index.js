const mongoose = require('mongoose');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/saas-framework');
    console.log('Cleanup: Cleaning up Roles index...');

    try {
        const collection = mongoose.connection.collection('roles');
        
        // 1. Drop the old single-field unique index
        try {
            await collection.dropIndex('key_1');
            console.log('✅ Dropped key_1 index');
        } catch (e) {
            console.log('ℹ️ key_1 index not found or already dropped');
        }

        // 2. Drop the other counter index if needed or just let it re-sync
        // In Mongoose, it will recreate the compound index on next run.

    } catch (err) {
        console.error('❌ Error during cleanup:', err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
