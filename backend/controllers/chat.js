const axios = require('axios');

exports.handleChat = async (req, res) => {
    const { messages, model, stream, temperature, max_tokens, thinking } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages are required' });
    }
    if (!process.env.ZHIPU_API_KEY) {
        return res.status(503).json({ error: 'AI service is not configured' });
    }

    const useStream = stream !== false; // 默认开启流式
    const allowedModels = new Set(['glm-4.5', 'glm-4.5-flash']);
    const reqBody = {
        model: allowedModels.has(model) ? model : 'glm-4.5-flash',
        messages,
        stream: useStream,
        max_tokens: Math.min(Math.max(Number(max_tokens) || 1024, 64), 2048),
        temperature: typeof temperature === 'number' ? temperature : 0.6,
    };
    if (thinking && thinking.type === 'enabled') {
        reqBody.thinking = { type: 'enabled' };
    }

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

            // 直接透传上游 SSE
            response.data.pipe(res);

            // 客户端断开时清理
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

            // 尽量返回简化后的内容
            const data = response.data;
            let content = '';
            try {
                content = data.choices?.[0]?.message?.content || '';
            } catch (_) {}
            res.json({ content, raw: data });
        }
    } catch (error) {
        const detail = error.response?.data || error.message;
        console.error('Error calling ZhipuAI API:', detail);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to communicate with AI service', detail });
        }
    }
};

