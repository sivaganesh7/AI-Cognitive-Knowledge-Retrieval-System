const path = require('path');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Support both server/.env and workspace-root .env without overriding existing vars.
dotenv.config({ path: path.join(__dirname, '../.env'), override: false });
dotenv.config({ path: path.join(__dirname, '../../.env'), override: false });

let client;
let database;

async function ensureIndexes(db) {
  await db.collection('users').createIndexes([
    { key: { firebase_uid: 1 }, unique: true, name: 'users_firebase_uid_uq' },
    { key: { email: 1 }, unique: true, name: 'users_email_uq' },
    { key: { username: 1 }, unique: true, sparse: true, name: 'users_username_uq' },
  ]);

  await db.collection('notes').createIndexes([
    { key: { user_id: 1, created_at: -1 }, name: 'notes_user_created_idx' },
    { key: { user_id: 1, updated_at: -1 }, name: 'notes_user_updated_idx' },
    { key: { user_id: 1, type: 1 }, name: 'notes_user_type_idx' },
    { key: { user_id: 1, tags: 1 }, name: 'notes_user_tags_idx' },
    { key: { is_public: 1, created_at: -1 }, name: 'notes_public_created_idx' },
  ]);

  await db.collection('conversations').createIndex(
    { user_id: 1 },
    { unique: true, name: 'conversations_user_uq' }
  );
}

async function connectMongo() {
  if (database) return database;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI in environment variables.');
  }

  const dbName = process.env.MONGODB_DB_NAME || 'second_brain';
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 60),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
    maxConnecting: Number(process.env.MONGO_MAX_CONNECTING || 8),
    waitQueueTimeoutMS: Number(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS || 10000),
  });

  await client.connect();
  database = client.db(dbName);
  await ensureIndexes(database);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DB] Connected to MongoDB (${dbName})`);
  }

  return database;
}

function getDb() {
  if (!database) {
    throw new Error('MongoDB is not connected. Call connectMongo() before querying.');
  }
  return database;
}

function getCollections() {
  const db = getDb();
  return {
    users: db.collection('users'),
    notes: db.collection('notes'),
    conversations: db.collection('conversations'),
  };
}

module.exports = {
  connectMongo,
  getDb,
  getCollections,
};
