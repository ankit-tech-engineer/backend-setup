const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('Testing connection to:', process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log('SUCCESS: Connected to MongoDB Atlas!');
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('SUCCESS: Pinged deployment!');
  } catch (err) {
    console.error('FAILURE: Could not connect to MongoDB:');
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testConnection();
