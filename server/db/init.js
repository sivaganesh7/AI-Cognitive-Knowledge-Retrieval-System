require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { connectMongo, getDb } = require('./pool');

async function initDatabase() {
  console.log('🔧 Initializing MongoDB connection and indexes...');

  try {
    await connectMongo();
    await getDb().command({ ping: 1 });
    console.log('✅ MongoDB connected and indexes initialized successfully!');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err.message);
    process.exit(1);
  }
}

initDatabase();
