const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // In test environment or if explicit fallback requested or no URI provided
    if (process.env.NODE_ENV === 'test') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log('Using in-memory MongoDB for testing');
    } else if (mongoUri) {
      try {
        const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
        console.log(`Connected to external MongoDB: ${conn.connection.host}`);
        return conn;
      } catch (err) {
        console.warn(
          `External MongoDB connection failed (${err.message}). Falling back to in-memory database...`
        );
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        console.log('In-memory MongoDB initialized for zero-config development');
      }
    } else {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log('No MONGO_URI provided. Initialized in-memory MongoDB instance');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('Error closing MongoDB connection', err);
  }
};

module.exports = { connectDB, disconnectDB };
