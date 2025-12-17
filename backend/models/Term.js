const mongoose = require('mongoose');
const { Schema } = mongoose;

const TermSchema = new Schema({
  term: { type: String, required: true, index: true },
  meaning: { type: String, required: true },
  cat: { type: String, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users' },
}, { timestamps: true });

module.exports = mongoose.model('terms', TermSchema);

