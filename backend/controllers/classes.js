const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const mongoose = require('mongoose');

function genInviteCode(len = 6) {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符
  let code = '';
  for (let i = 0; i < len; i++) code += charset[Math.floor(Math.random() * charset.length)];
  return code;
}

exports.createClass = async (req, res) => {
  try {
    const { name, subject, period, inviteExpiresAt, inviteMaxUses = 0 } = req.body || {};
    if (!name) return res.status(400).json({ error: '班级名称必填' });

    const invite = {
      code: genInviteCode(Math.floor(6 + Math.random() * 3)),
      expiresAt: inviteExpiresAt ? new Date(inviteExpiresAt) : undefined,
      maxUses: typeof inviteMaxUses === 'number' ? inviteMaxUses : 0,
      usedCount: 0,
    };

    const cls = await Class.create({
      name, subject, period,
      teacher: req.user._id,
      invite,
      members: [],
    });
    res.json(cls);
  } catch (e) {
    console.error('createClass error', e);
    res.status(500).json({ error: '创建班级失败' });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权操作' });

    const { name, subject, period, inviteExpiresAt, inviteMaxUses } = req.body || {};
    if (typeof name === 'string' && name.trim()) cls.name = name.trim();
    if (typeof subject === 'string') cls.subject = subject;
    if (typeof period === 'string') cls.period = period;

    // 可选更新邀请码配置（不重置 code，只更新限制）
    if (!cls.invite) cls.invite = {};
    if (inviteExpiresAt !== undefined) {
      cls.invite.expiresAt = inviteExpiresAt ? new Date(inviteExpiresAt) : undefined;
    }
    if (inviteMaxUses !== undefined) {
      cls.invite.maxUses = Number(inviteMaxUses) || 0;
    }

    await cls.save();
    res.json(cls);
  } catch (e) {
    console.error('updateClass error', e);
    res.status(500).json({ error: '更新失败' });
  }
};

exports.resetInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiresAt, maxUses = 0 } = req.body || {};
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权操作' });

    cls.invite = {
      code: genInviteCode(Math.floor(6 + Math.random() * 3)),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxUses: typeof maxUses === 'number' ? maxUses : 0,
      usedCount: 0,
    };
    await cls.save();
    res.json({ invite: cls.invite });
  } catch (e) {
    console.error('resetInvite error', e);
    res.status(500).json({ error: '重置邀请码失败' });
  }
};

exports.joinByCode = async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: '缺少邀请码' });

    const cls = await Class.findOne({ 'invite.code': code.toUpperCase() });
    if (!cls) return res.status(404).json({ error: '邀请码无效' });

    const now = new Date();
    if (cls.invite.expiresAt && now > cls.invite.expiresAt) {
      return res.status(400).json({ error: '邀请码已过期' });
    }
    if (cls.invite.maxUses && cls.invite.usedCount >= cls.invite.maxUses) {
      return res.status(400).json({ error: '邀请码使用次数已达上限' });
    }

    const uid = String(req.user._id);
    const already = cls.members.find(m => String(m) === uid);
    if (!already) {
      cls.members.push(req.user._id);
      cls.invite.usedCount = (cls.invite.usedCount || 0) + 1;
      await cls.save();
    }

    res.json({ success: true, classId: cls._id });
  } catch (e) {
    console.error('joinByCode error', e);
    res.status(500).json({ error: '加入班级失败' });
  }
};

exports.myClasses = async (req, res) => {
  try {
    const classes = await Class.find({ members: req.user._id })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const ids = classes.map(c => c._id);
    const latestByClass = await Assignment.aggregate([
      { $match: { class: { $in: ids } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$class', latest: { $first: { title: '$title', createdAt: '$createdAt', dueAt: '$dueAt' } } } }
    ]);
    const map = new Map(latestByClass.map(x => [String(x._id), x.latest]));
    const result = classes.map(c => ({
      _id: c._id,
      name: c.name,
      subject: c.subject,
      period: c.period,
      teacher: c.teacher,
      membersCount: (c.members || []).length,
      latestAssignment: map.get(String(c._id)) || null,
      invite: undefined,
    }));
    res.json(result);
  } catch (e) {
    console.error('myClasses error', e);
    res.status(500).json({ error: '获取我的班级失败' });
  }
};

exports.teachingClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const ids = classes.map(c => c._id);
    const latestByClass = await Assignment.aggregate([
      { $match: { class: { $in: ids } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$class', latest: { $first: { title: '$title', createdAt: '$createdAt', dueAt: '$dueAt' } } } }
    ]);
    const map = new Map(latestByClass.map(x => [String(x._id), x.latest]));

    const result = classes.map(c => ({
      _id: c._id,
      name: c.name,
      subject: c.subject,
      period: c.period,
      membersCount: (c.members || []).length,
      invite: c.invite,
      latestAssignment: map.get(String(c._id)) || null,
    }));
    res.json(result);
  } catch (e) {
    console.error('teachingClasses error', e);
    res.status(500).json({ error: '获取我教的班级失败' });
  }
};

exports.classMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id).lean();
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权访问' });

    const clsPop = await Class.findById(id).populate('members', 'name email').lean();
    res.json({ members: clsPop.members || [] });
  } catch (e) {
    console.error('classMembers error', e);
    res.status(500).json({ error: '获取成员失败' });
  }
};

exports.classDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Class.findById(id).populate('teacher', 'name email').lean();
    if (!cls) return res.status(404).json({ error: '班级不存在' });

    const latestAssignment = await Assignment.findOne({ class: id }).sort({ createdAt: -1 }).lean();
    res.json({
      _id: cls._id,
      name: cls.name,
      subject: cls.subject,
      period: cls.period,
      teacher: cls.teacher,
      membersCount: (cls.members || []).length,
      latestAssignment: latestAssignment ? { title: latestAssignment.title, dueAt: latestAssignment.dueAt } : null,
    });
  } catch (e) {
    console.error('classDetail error', e);
    res.status(500).json({ error: '获取班级详情失败' });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { id, uid } = req.params; // classId, userId to remove
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权操作' });

    if (String(uid) === String(cls.teacher)) {
      return res.status(400).json({ error: '不可移除教师本人' });
    }

    const before = (cls.members || []).length;
    cls.members = (cls.members || []).filter(m => String(m) !== String(uid));
    const after = cls.members.length;
    await cls.save();

    res.json({ success: true, removed: before - after });
  } catch (e) {
    console.error('removeMember error', e);
    res.status(500).json({ error: '移除成员失败' });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, period } = req.body || {};
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权操作' });

    if (typeof name === 'string' && name.trim()) cls.name = name.trim();
    if (typeof subject === 'string') cls.subject = subject;
    if (typeof period === 'string') cls.period = period;
    await cls.save();
    res.json({ success: true, class: cls });
  } catch (e) {
    console.error('updateClass error', e);
    res.status(500).json({ error: '更新班级失败' });
  }
};

exports.dashboard = async (req, res) => {
  try {
    const { id } = req.params; // classId
    const cls = await Class.findById(id);
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权访问' });

    const membersCount = (cls.members || []).length;
    const assignmentsCount = await Assignment.countDocuments({ class: id });

    res.json({
      membersCount,
      assignmentsCount,
      completionRate: 0,
      averageScore: 0,
      commonMistakes: [],
    });
  } catch (e) {
    console.error('dashboard error', e);
    res.status(500).json({ error: '获取数据看板失败' });
  }
};
