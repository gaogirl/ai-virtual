const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');

// GET /api/submissions/:id  获取单份提交详情（含题目与参考答案、学生信息）
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await Submission.findById(id).populate('student', 'name email').lean();
    if (!sub) return res.status(404).json({ error: '提交不存在' });

    const assignment = await Assignment.findById(sub.assignment).lean();
    if (!assignment) return res.status(404).json({ error: '作业不存在' });

    const cls = await Class.findById(assignment.class).lean();
    if (!cls) return res.status(404).json({ error: '班级不存在' });

    // 权限：必须是该班级教师
    if (String(cls.teacher) !== String(req.user._id)) {
      return res.status(403).json({ error: '无权访问' });
    }

    res.json({
      _id: sub._id,
      status: sub.status,
      totalScore: sub.totalScore,
      comment: sub.comment,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      student: sub.student,
      answers: sub.answers || [],
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        type: assignment.type,
        questions: assignment.questions || [], // 包含 referenceAnswer，便于教师对比
      }
    });
  } catch (e) {
    console.error('submissions.getOne error', e);
    res.status(500).json({ error: '获取提交详情失败' });
  }
};

// POST /api/submissions/:id/grade  教师批改（更新每题分数/反馈、总评与总分）
// body: { answers: [{index, score?, feedback?}], totalScore?, comment? }
exports.grade = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers = [], totalScore, comment } = req.body || {};

    const sub = await Submission.findById(id);
    if (!sub) return res.status(404).json({ error: '提交不存在' });
    const assignment = await Assignment.findById(sub.assignment);
    if (!assignment) return res.status(404).json({ error: '作业不存在' });
    const cls = await Class.findById(assignment.class);
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    if (String(cls.teacher) !== String(req.user._id)) {
      return res.status(403).json({ error: '无权操作' });
    }

    // 合并每题批注
    const map = new Map((answers || []).map(a => [Number(a.index), a]));
    const merged = (sub.answers || []).map((a) => {
      const patch = map.get(Number(a.index));
      if (!patch) return a;
      const next = { ...a.toObject?.() ? a.toObject() : a };
      if (typeof patch.score === 'number') next.score = patch.score;
      if (typeof patch.feedback === 'string') next.feedback = patch.feedback;
      return next;
    });

    // 若传入 index 超过当前长度，追加（防止教师手动加评）
    for (const [idx, patch] of map.entries()) {
      const exists = merged.find(x => Number(x.index) === Number(idx));
      if (!exists) {
        merged.push({ index: Number(idx), score: patch.score, feedback: patch.feedback });
      }
    }

    sub.answers = merged;

    // 计算总分：优先使用传入 totalScore，否则按平均分（忽略 null）
    if (typeof totalScore === 'number') {
      sub.totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
    } else {
      const scores = merged.map(x => typeof x.score === 'number' ? x.score : null).filter(x => x !== null);
      sub.totalScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : sub.totalScore;
    }

    if (typeof comment === 'string') {
      sub.comment = comment;
    }
    sub.status = 'graded';

    await sub.save();
    res.json(sub);
  } catch (e) {
    console.error('submissions.grade error', e);
    res.status(500).json({ error: '批改失败' });
  }
};

