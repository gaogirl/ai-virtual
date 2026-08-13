import axios from 'axios';

// 智谱AI Chat Completions 接口
// 文档: https://open.bigmodel.cn/dev/api#chatglm_turbo
const ZHIPU_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

export async function translateWithZhipu({ text, from = '中文', to = '英文', model = 'glm-4-flash' }) {
  const apiKey = import.meta.env.VITE_ZHIPU_API_KEY;
  if (!apiKey) {
    throw new Error('缺少 VITE_ZHIPU_API_KEY');
  }

  const sys = `你是专业的翻译助手。严格按要求直译或意译并输出目标语言，不要添加多余解释。\n源语言: ${from}\n目标语言: ${to}`;

  const payload = {
    model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: text }
    ],
    temperature: 0.2,
  };

  const res = await axios.post(ZHIPU_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const content = res?.data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('智谱AI无返回内容');
  return content;
}




