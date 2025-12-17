const Term = require('../models/Term');
const Case = require('../models/Case');

// ===== Terms =====
exports.listTerms = async (req, res) => {
  try {
    const { key = '', cat = '', page = '1', pageSize = '50', ids: idsParam } = req.query || {};
    const q = {};
    if (key) q.$or = [{ term: new RegExp(key, 'i') }, { meaning: new RegExp(key, 'i') }];
    if (cat) q.cat = cat;
    if (idsParam) {
      const ids = Array.isArray(idsParam) ? idsParam : String(idsParam).split(',').map(s=>s.trim()).filter(Boolean);
      if (ids.length) q._id = { $in: ids };
    }
    const p = Math.max(1, parseInt(page, 10));
    const ps = Math.min(100, parseInt(pageSize, 10));
    const total = await Term.countDocuments(q);
    const list = await Term.find(q).sort({ createdAt: -1 }).skip((p - 1) * ps).limit(ps).lean();
    res.json({ total, page: p, pageSize: ps, list });
  } catch (e) {
    console.error('listTerms error', e);
    res.status(500).json({ error: '获取术语失败' });
  }
};

exports.createTerm = async (req, res) => {
  try {
    const { term, meaning, cat } = req.body || {};
    if (!term || !meaning) return res.status(400).json({ error: 'term 与 meaning 必填' });
    const doc = await Term.create({ term, meaning, cat, createdBy: req.user?._id });
    res.json(doc);
  } catch (e) {
    console.error('createTerm error', e);
    res.status(500).json({ error: '新增术语失败' });
  }
};

exports.updateTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const { term, meaning, cat } = req.body || {};
    const doc = await Term.findById(id);
    if (!doc) return res.status(404).json({ error: '术语不存在' });
    if (typeof term === 'string' && term.trim()) doc.term = term.trim();
    if (typeof meaning === 'string' && meaning.trim()) doc.meaning = meaning.trim();
    if (typeof cat === 'string') doc.cat = cat;
    await doc.save();
    res.json(doc);
  } catch (e) {
    console.error('updateTerm error', e);
    res.status(500).json({ error: '更新术语失败' });
  }
};

exports.removeTerm = async (req, res) => {
  try {
    const { id } = req.params;
    await Term.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (e) {
    console.error('removeTerm error', e);
    res.status(500).json({ error: '删除术语失败' });
  }
};

// ===== Cases =====
exports.listCases = async (req, res) => {
  try {
    const { key = '', domain = '', tag = '', page = '1', pageSize = '20', ids: idsParam } = req.query || {};
    const q = {};
    if (key) q.$or = [{ title: new RegExp(key, 'i') }, { summary: new RegExp(key, 'i') }, { content: new RegExp(key, 'i') }];
    if (domain) q.domain = domain;
    if (tag) q.tags = tag;
    if (idsParam) {
      const ids = Array.isArray(idsParam) ? idsParam : String(idsParam).split(',').map(s=>s.trim()).filter(Boolean);
      if (ids.length) q._id = { $in: ids };
    }
    const p = Math.max(1, parseInt(page, 10));
    const ps = Math.min(100, parseInt(pageSize, 10));
    const total = await Case.countDocuments(q);
    const list = await Case.find(q).sort({ createdAt: -1 }).skip((p - 1) * ps).limit(ps).lean();
    // 只返回部分字段用于卡片列表
    const data = list.map(c => ({ _id: c._id, title: c.title, domain: c.domain, summary: c.summary, tags: c.tags, createdAt: c.createdAt }));
    res.json({ total, page: p, pageSize: ps, list: data });
  } catch (e) {
    console.error('listCases error', e);
    res.status(500).json({ error: '获取案例失败' });
  }
};

exports.getCase = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Case.findById(id).lean();
    if (!doc) return res.status(404).json({ error: '案例不存在' });
    res.json(doc);
  } catch (e) {
    console.error('getCase error', e);
    res.status(500).json({ error: '获取案例失败' });
  }
};

exports.createCase = async (req, res) => {
  try {
    const { title, domain, summary, content, tags = [] } = req.body || {};
    if (!title) return res.status(400).json({ error: '标题必填' });
    const doc = await Case.create({ title, domain, summary, content, tags, createdBy: req.user._id });
    res.json(doc);
  } catch (e) {
    console.error('createCase error', e);
    res.status(500).json({ error: '新增案例失败' });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, domain, summary, content, tags } = req.body || {};
    const doc = await Case.findById(id);
    if (!doc) return res.status(404).json({ error: '案例不存在' });
    if (String(doc.createdBy) !== String(req.user._id) && req.user.role !== 'teacher') return res.status(403).json({ error: '无权操作' });
    if (typeof title === 'string' && title.trim()) doc.title = title.trim();
    if (typeof domain === 'string') doc.domain = domain;
    if (typeof summary === 'string') doc.summary = summary;
    if (typeof content === 'string') doc.content = content;
    if (Array.isArray(tags)) doc.tags = tags;
    await doc.save();
    res.json(doc);
  } catch (e) {
    console.error('updateCase error', e);
    res.status(500).json({ error: '更新案例失败' });
  }
};

exports.removeCase = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Case.findById(id);
    if (!doc) return res.status(404).json({ error: '案例不存在' });
    if (String(doc.createdBy) !== String(req.user._id) && req.user.role !== 'teacher') return res.status(403).json({ error: '无权操作' });
    await Case.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (e) {
    console.error('removeCase error', e);
    res.status(500).json({ error: '删除案例失败' });
  }
};

