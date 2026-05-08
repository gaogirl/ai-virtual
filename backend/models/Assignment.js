const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuestionItemSchema = new Schema({
  type: { type: String, enum: ['zh-en','en-zh','read'], required: true },
  promptText: { type: String, required: true },
  referenceAnswer: { type: String },
  difficulty: { type: String },
  topic: { type: String },
  knowledgeTags: [{ type: String }],
}, { _id: false });

const AssignmentSchema = new Schema({
  class: { type: Schema.Types.ObjectId, ref: 'classes', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['zh-en','en-zh','read'], required: true },
  questions: { type: [QuestionItemSchema], default: [] },
  dueAt: { type: Date },
  retryLimit: { type: Number, default: 1 },
  allowViewRef: { type: Boolean, default: false },
  termIds: [{ type: Schema.Types.ObjectId, ref: 'terms' }],
  caseIds: [{ type: Schema.Types.ObjectId, ref: 'cases' }],
}, { timestamps: true });

module.exports = mongoose.model('assignments', AssignmentSchema);

