// backend/models/Summary.model.js
import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  snippet: {
    type: String,
    required: true,
    maxlength: 200
  },
  wordCount: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
summarySchema.index({ date: -1 });

const Summary = mongoose.model('Summary', summarySchema);

export default Summary;