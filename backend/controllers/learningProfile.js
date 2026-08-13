const Submission = require('../models/Submission');

exports.getMine = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('assignment', 'title type questions')
      .sort({ updatedAt: -1 }).lean();
    const scored = submissions.filter(s => typeof s.totalScore === 'number');
    const directions = { 'zh-en': [], 'en-zh': [], read: [] };
    scored.forEach(s => {
      const assignment = s.assignment;
      if (!assignment) return;
      const byType = new Map();
      (s.answers || []).forEach(answer => {
        const q = assignment.questions?.[answer.index];
        if (q && typeof answer.score === 'number') {
          if (!byType.has(q.type)) byType.set(q.type, []);
          byType.get(q.type).push(answer.score);
        }
      });
      if (!byType.size) byType.set(assignment.type, [s.totalScore]);
      byType.forEach((values, type) => { if (directions[type]) directions[type].push(...values); });
    });
    const average = values => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
    const directionScores = Object.fromEntries(Object.entries(directions).map(([key, values]) => [key, average(values)]));
    const overall = average(scored.map(s => s.totalScore));
    const suggestions = [];
    Object.entries(directionScores).filter(([, score]) => score !== null).sort((a, b) => a[1] - b[1]).slice(0, 2)
      .forEach(([type, score]) => { if (score < 80) suggestions.push(`加强${type === 'zh-en' ? '中译英' : type === 'en-zh' ? '英译中' : '朗读'}练习（当前${score}分）`); });
    if (!submissions.length) suggestions.push('先完成一份作业，系统会根据提交结果生成个性化建议');
    res.json({
      user: { _id: req.user._id, name: req.user.name, email: req.user.email },
      totals: { submissions: submissions.length, graded: scored.length, averageScore: overall },
      directionScores,
      recentActivity: submissions.slice(0, 8).map(s => ({ assignmentId: s.assignment?._id, title: s.assignment?.title, type: s.assignment?.type, score: s.totalScore ?? null, status: s.status, updatedAt: s.updatedAt })),
      suggestions,
    });
  } catch (e) {
    console.error('learningProfile.getMine error', e);
    res.status(500).json({ error: '获取学习画像失败' });
  }
};
