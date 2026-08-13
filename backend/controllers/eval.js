const axios = require('axios');

// 评估翻译质量（调用智谱大模型，返回结构化分数与建议）
// POST /api/eval/translation
// body: { direction: 'zh-en'|'en-zh', sourceText: string, studentText: string, refText?: string, model?: string }
exports.evaluateTranslation = async (req, res) => {
  try {
    const { direction = 'zh-en', sourceText = '', studentText = '', refText = '', model } = req.body || {};
    if (!sourceText.trim() || !studentText.trim()) {
      return res.status(400).json({ error: 'sourceText 与 studentText 为必填' });
    }

    const sys = `你是一名严格的翻译质量评估专家。请只返回一个纯 JSON 对象，字段如下：{
      overall: number 0-100,
      accuracy: number 0-100,
      fidelity: number 0-100,
      fluency: number 0-100,
      grammar: number 0-100,
      suggestions: string // 用中文分条给出可操作的改进建议，每条以“• ”开头
    }`;

    const prompt = [
      `评估方向: ${direction}`,
      `原文:\n${sourceText}`,
      `学生译文:\n${studentText}`,
      refText ? `参考译文:\n${refText}` : '',
      `请从准确度/忠实度/流畅度/语法四方面打分，并给出中文建议（分条，简洁可执行）。`
    ].filter(Boolean).join('\n\n');

    const resp = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: model || 'glm-4.5-flash',
        stream: false,
        temperature: 0.2,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const text = resp.data?.choices?.[0]?.message?.content || '{}';
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = { overall: null, suggestions: text }; }
    return res.json({ result: parsed, raw: resp.data });
  } catch (e) {
    console.error('evaluateTranslation error', e.response?.data || e.message);
    return res.status(500).json({ error: '评估失败', detail: e.response?.data || e.message });
  }
};
