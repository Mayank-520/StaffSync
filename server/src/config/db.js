const mongoose = require('mongoose');

/**
 * Connect to MongoDB with automatic retry and credential masking.
 * @param {number} maxRetries - Maximum connection attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 */
const connectDB = async (maxRetries = 3, delayMs = 2000) => {
  const connUri = process.env.MONGODB_URI;

  if (!connUri || connUri.includes('<username>')) {
    console.warn('⚠️  [MongoDB Warning]: MONGODB_URI is not configured with valid credentials in server/.env.');
    console.warn('👉 Please configure your MongoDB Atlas connection string in server/.env before testing database operations.');
    return null;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await mongoose.connect(connUri, {
        serverSelectionTimeoutMS: 15000,
        maxPoolSize: 10,
        minPoolSize: 1
      });
      console.log(`✅ [MongoDB Connected]: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      // Mask any credentials in error message
      const safeErrorMsg = error.message.replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb+srv://***:***@');
      console.warn(`⚠️  [MongoDB Connection Attempt ${attempt}/${maxRetries} Failed]: ${safeErrorMsg}`);

      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in ${delayMs / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error('❌ [MongoDB Connection Error]: Could not establish connection after maximum retries.');
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        }
        throw error;
      }
    }
  }
};

module.exports = connectDB;
