const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const axios = require('axios');

// 调用智谱AI对翻译做自动初评（简版）
async function evaluateTranslation(studentText, referenceText, direction = 'zh-en') {
  if (!referenceText) return { score: null, feedback: '无参考答案，跳过自动初评' };
  const sys = `You are a strict translation evaluator. Compare the student's translation with the reference and give a JSON object with fields: {score: number 0-100, feedback: string}. Consider accuracy, fidelity, grammar, fluency. Direction: ${direction}. Answer ONLY pure JSON.`;
  const prompt = `Reference:\n${referenceText}\n\nStudent:\n${studentText}`;
  try {
    const resp = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4.5-flash',
        stream: false,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 512,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    const text = resp.data?.choices?.[0]?.message?.content || '';
    const json = JSON.parse(text);
    const score = typeof json.score === 'number' ? json.score : null;
    const feedback = typeof json.feedback === 'string' ? json.feedback : String(text);
    return { score, feedback };
  } catch (e) {
    return { score: null, feedback: '自动初评失败，待教师批改' };
  }
}

// 教师：布置作业
exports.create = async (req, res) => {
  try {
    const { classId, title, type, questions = [], dueAt, retryLimit = 1, allowViewRef = false, termIds = [], caseIds = [] } = req.body || {};
    if (!classId || !title || !type) {
      return res.status(400).json({ error: 'classId / title / type 必填' });
    }
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权操作' });

    const assn = await Assignment.create({
      class: classId,
      createdBy: req.user._id,
      title,
      type,
      questions,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      retryLimit,
      allowViewRef,
      termIds: Array.isArray(termIds) ? termIds : [],
      caseIds: Array.isArray(caseIds) ? caseIds : [],
    });
    res.json(assn);
  } catch (e) {
    console.error('assignment.create error', e);
    res.status(500).json({ error: '创建作业失败' });
  }
};

// 学生：获取某班级作业列表 + 我在该作业的状态（pending/submitted/graded）
exports.listForStudent = async (req, res) => {
  try {
    const { classId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const pageSize = Math.min(parseInt(req.query.pageSize || '10', 10), 50);

    // 仅班级成员可查看
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ error: '班级不存在' });
    const isMember = (cls.members || []).some(m => String(m) === String(req.user._id)) || String(cls.teacher) === String(req.user._id);
    if (!isMember) return res.status(403).json({ error: '非班级成员无法查看' });

    const total = await Assignment.countDocuments({ class: classId });
    const list = await Assignment.find({ class: classId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const assnIds = list.map(a => a._id);
    const subs = await Submission.find({ assignment: { $in: assnIds }, student: req.user._id })
      .select('assignment status totalScore createdAt updatedAt')
      .lean();
    const subMap = new Map(subs.map(s => [String(s.assignment), s]));

    const result = list.map(a => {
      const s = subMap.get(String(a._id));
      let status = 'pending';
      if (s) status = s.status || 'submitted';
      return {
        _id: a._id,
        title: a.title,
        type: a.type,
        dueAt: a.dueAt,
        createdAt: a.createdAt,
        status,
        myScore: s?.totalScore ?? null,
      };
    });
    res.json({ page, pageSize, total, list: result });
  } catch (e) {
    console.error('assignments.listForStudent error', e);
    res.status(500).json({ error: '获取作业列表失败' });
  }
};

// 获取作业详情（含题目，隐藏参考答案）
exports.detail = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Assignment.findById(id).lean();
    if (!a) return res.status(404).json({ error: '作业不存在' });

    // 仅班级成员可查看
    const cls = await Class.findById(a.class);
    const isMember = (cls.members || []).some(m => String(m) === String(req.user._id)) || String(cls.teacher) === String(req.user._id);
    if (!isMember) return res.status(403).json({ error: '无权访问' });

    const questions = (a.questions || []).map(q => ({
      type: q.type,
      promptText: q.promptText,
      difficulty: q.difficulty,
      topic: q.topic,
      knowledgeTags: q.knowledgeTags,
    }));

    res.json({
      _id: a._id,
      class: a.class,
      title: a.title,
      type: a.type,
      dueAt: a.dueAt,
      retryLimit: a.retryLimit,
      allowViewRef: a.allowViewRef,
      questions,
      termIds: a.termIds || [],
      caseIds: a.caseIds || [],
    });
  } catch (e) {
    console.error('assignment.detail error', e);
    res.status(500).json({ error: '获取作业详情失败' });
  }
};

// 学生：提交翻译/朗读作业答案（支持 AI 自动初评）
exports.submit = async (req, res) => {
  try {
    const { id } = req.params; // assignmentId
    const { answers = [] } = req.body || {};
    const a = await Assignment.findById(id).lean();
    if (!a) return res.status(404).json({ error: '作业不存在' });

    // 权限：班级成员
    const cls = await Class.findById(a.class);
    const isMember = (cls.members || []).some(m => String(m) === String(req.user._id));
    if (!isMember) return res.status(403).json({ error: '非班级成员无法提交' });

    // 生成自动初评（仅翻译题）
    const evaluated = [];
    for (let i = 0; i < answers.length; i++) {
      const ans = answers[i];
      const q = a.questions[i];
      if (!q) continue;
      const item = { index: i, text: ans?.text, audioUrl: ans?.audioUrl };
      if (q.type === 'zh-en' || q.type === 'en-zh') {
        const { score, feedback } = await evaluateTranslation(ans?.text || '', q.referenceAnswer || '', q.type);
        item.score = score ?? undefined;
        item.feedback = feedback;
      }
      evaluated.push(item);
    }

    // 聚合总分（忽略 null）
    const scores = evaluated.map(x => typeof x.score === 'number' ? x.score : null).filter(x => x !== null);
    const totalScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0) / scores.length) : undefined;
    const status = typeof totalScore === 'number' ? 'graded' : 'submitted';

    const doc = await Submission.findOneAndUpdate(
      { assignment: id, student: req.user._id },
      { $set: { answers: evaluated, totalScore, status } },
      { new: true, upsert: true }
    );

    res.json(doc);
  } catch (e) {
    console.error('assignment.submit error', e);
    res.status(500).json({ error: '提交失败' });
  }
};

// 教师：更新作业（标题/类型/截止/重试/允许查看参考答案/题目/术语包/案例）
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Assignment.findById(id);
    if (!a) return res.status(404).json({ error: '作业不存在' });
    const cls = await Class.findById(a.class);
    if (!cls || String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权操作' });

    const { title, type, questions, dueAt, retryLimit, allowViewRef, termIds, caseIds } = req.body || {};
    if (typeof title === 'string' && title.trim()) a.title = title.trim();
    if (typeof type === 'string') a.type = type;
    if (Array.isArray(questions)) a.questions = questions;
    if (dueAt !== undefined) a.dueAt = dueAt ? new Date(dueAt) : undefined;
    if (retryLimit !== undefined) a.retryLimit = Number(retryLimit) || 1;
    if (allowViewRef !== undefined) a.allowViewRef = !!allowViewRef;
    if (Array.isArray(termIds)) a.termIds = termIds;
    if (Array.isArray(caseIds)) a.caseIds = caseIds;

    await a.save();
    res.json({ success: true, assignment: a });
  } catch (e) {
    console.error('assignment.update error', e);
    res.status(500).json({ error: '更新作业失败' });
  }
};

// 教师：删除作业
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Assignment.findById(id);
    if (!a) return res.status(404).json({ error: '作业不存在' });
    const cls = await Class.findById(a.class);
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权操作' });

    await Assignment.deleteOne({ _id: id });
    await Submission.deleteMany({ assignment: id });
    res.json({ success: true });
  } catch (e) {
    console.error('assignment.remove error', e);
    res.status(500).json({ error: '删除作业失败' });
  }
};

// 教师：查看某作业的提交列表（简版）
exports.submissionsOf = async (req, res) => {
  try {
    const { id } = req.params; // assignmentId
    const a = await Assignment.findById(id).lean();
    if (!a) return res.status(404).json({ error: '作业不存在' });
    const cls = await Class.findById(a.class);
    if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ error: '无权访问' });

    const subs = await Submission.find({ assignment: id }).populate('student', 'name email').lean();
    res.json(subs);
  } catch (e) {
    console.error('assignment.submissionsOf error', e);
    res.status(500).json({ error: '获取提交列表失败' });
  }
};
