// backend/test-conn.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  }
})();
