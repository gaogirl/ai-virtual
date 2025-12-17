const mongoose = require('mongoose');
const { Schema } = mongoose;

const InviteSchema = new Schema({
  code: { type: String, index: true }, // 6-8位唯一码
  expiresAt: { type: Date },
  maxUses: { type: Number, default: 0 }, // 0 表示不限
  usedCount: { type: Number, default: 0 },
}, { _id: false });

const ClassSchema = new Schema({
  name: { type: String, required: true },
  subject: { type: String }, // 学科类型
  period: { type: String }, // 学习周期描述
  teacher: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  invite: { type: InviteSchema, default: {} },
  members: [{ type: Schema.Types.ObjectId, ref: 'users' }],
}, { timestamps: true });

module.exports = mongoose.model('classes', ClassSchema);

