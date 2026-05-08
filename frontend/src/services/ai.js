// AI 对话与翻译前端封装（使用后端代理，避免暴露密钥）
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

// 流式SSE处理
async function streamSSE(url, data, onDelta) {
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!resp.ok) {
      throw new Error(await resp.text().catch(() => '请求失败'));
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') break;

        try {
          const data = JSON.parse(dataStr);
          if (data.choices?.[0]?.delta) {
            onDelta(data.choices[0].delta);
          }
        } catch (e) {
          console.warn('Failed to parse SSE data:', e);
        }
      }
    }
  } catch (error) {
    // 处理网络错误
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('网络错误：无法连接到AI服务。这可能是因为您正在GitHub Pages上访问应用，而后端服务器仅在本地运行。');
    }
    throw error;
  }
}

export async function chatRequest(messages, { model = 'glm-4.5', stream = true, temperature = 0.6 } = {}, onDelta) {
  if (stream) {
    return streamSSE(`${API_BASE}/chat`, { messages, model, stream: true, temperature }, onDelta);
  } else {
    try {
      const resp = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, model, stream: false, temperature })
      });
      if (!resp.ok) throw new Error(await resp.text().catch(()=>'请求失败'));
      return resp.json(); // { content, raw }
    } catch (error) {
      // 处理网络错误
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('网络错误：无法连接到AI服务。这可能是因为您正在GitHub Pages上访问应用，而后端服务器仅在本地运行。');
      }
      throw error;
    }
  }
}

// 翻译请求
export async function translateRequest(text, { sourceLanguage = 'auto', targetLanguage = 'zh', model = 'glm-4.5', stream = true } = {}, onDelta) {
  if (stream) {
    return streamSSE(`${API_BASE}/translate`, { text, sourceLanguage, targetLanguage, model, stream: true }, onDelta);
  } else {
    try {
      const resp = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sourceLanguage, targetLanguage, model, stream: false })
      });
      if (!resp.ok) throw new Error(await resp.text().catch(()=>'请求失败'));
      return resp.json(); // { translation, raw }
    } catch (error) {
      // 处理网络错误
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('网络错误：无法连接到翻译服务。这可能是因为您正在GitHub Pages上访问应用，而后端服务器仅在本地运行。');
      }
      throw error;
    }
  }
}

export { API_BASE };


