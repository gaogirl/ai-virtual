const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnswerItemSchema = new Schema({
  index: { type: Number, required: true },
  text: { type: String }, // 翻译文本答案
  audioUrl: { type: String }, // 朗读音频地址
  score: { type: Number },
  feedback: { type: String },
}, { _id: false });

const SubmissionSchema = new Schema({
  assignment: { type: Schema.Types.ObjectId, ref: 'assignments', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  status: { type: String, enum: ['pending','in_progress','submitted','graded'], default: 'submitted' },
  answers: { type: [AnswerItemSchema], default: [] },
  totalScore: { type: Number },
  comment: { type: String },
}, { timestamps: true, indexes: [{ fields: { assignment: 1, student: 1 }, options: { unique: true } }] });

SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('submissions', SubmissionSchema);

