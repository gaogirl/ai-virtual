const axios = require('axios');

exports.handleTranslate = async (req, res) => {
  const { text, sourceLang = 'auto', targetLang = 'zh', model, stream, temperature } = req.body || {};

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'text 与 targetLang 为必填参数' });
  }

  const useStream = stream !== false; // 默认流式

  // 构造提示词，确保仅输出译文
  const systemPrompt = `You are a professional translator. Translate the user's text from ${sourceLang} to ${targetLang}.\n- Output only the translated text without any explanations.\n- Keep numbers, names, and code snippets unchanged.\n- Preserve formatting and line breaks.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text }
  ];

  const reqBody = {
    model: model || 'glm-4.5',
    messages,
    stream: useStream,
    temperature: typeof temperature === 'number' ? temperature : 0.2,
  };

  try {
    if (useStream) {
      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        reqBody,
        {
          headers: {
            'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          responseType: 'stream',
        }
      );

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      response.data.pipe(res);
      req.on('close', () => {
        try { response.data.destroy(); } catch (_) {}
      });
    } else {
      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        { ...reqBody, stream: false },
        {
          headers: {
            'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const data = response.data;
      const translation = data.choices?.[0]?.message?.content || '';
      res.json({ translation, raw: data });
    }
  } catch (error) {
    const detail = error.response?.data || error.message;
    console.error('Error calling ZhipuAI Translate API:', detail);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to translate', detail });
    }
  }
};


