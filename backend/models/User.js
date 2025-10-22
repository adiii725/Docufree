import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  contact: { type: String, required: true, trim: true },
  password: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
