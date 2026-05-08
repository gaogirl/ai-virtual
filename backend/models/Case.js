const mongoose = require('mongoose');
const { Schema } = mongoose;

const CaseSchema = new Schema({
  title: { type: String, required: true, index: true },
  domain: { type: String, index: true },
  summary: { type: String },
  content: { type: String }, // 富文本或 Markdown
  tags: [{ type: String, index: true }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
}, { timestamps: true });

module.exports = mongoose.model('cases', CaseSchema);

