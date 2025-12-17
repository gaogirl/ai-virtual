// AI 对话与翻译前端封装（使用后端代理，避免暴露密钥）
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function chatRequest(messages, { model = 'glm-4.5', stream = true, temperature = 0.6 } = {}, onDelta) {
  if (stream) {
    return streamSSE(`${API_BASE}/chat`, { messages, model, stream: true, temperature }, onDelta);
  } else {
    const resp = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model, stream: false, temperature })
    });
    if (!resp.ok) throw new Error(await resp.text().catch(()=>'请求失败'));
    return resp.json(); // { content, raw }
  }
}

export async function streamSSE(url, body, onDelta) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok || !resp.body) {
    const t = await resp.text().catch(()=> '');
    throw new Error(`请求失败: ${t || resp.status}`);
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalText = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') return finalText;
        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content
                      ?? json.choices?.[0]?.message?.content
                      ?? '';
          if (delta) {
            finalText += delta;
            onDelta?.(delta);
          }
        } catch { /* 忽略非 JSON 行 */ }
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  return finalText;
}

export { API_BASE };


