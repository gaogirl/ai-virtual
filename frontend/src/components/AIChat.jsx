import React, { useMemo, useRef, useState } from 'react';
import { chatRequest } from '../services/ai';
import './AIChat.css';

// 通用 AI 对话组件（支持 glm-4.5 与 glm-4.5-flash，支持流式）
export default function AIChat({ defaultModel = 'glm-4.5' }) {
  const [model, setModel] = useState(defaultModel);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // {role, content}
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const outputRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !streaming, [input, streaming]);

  const scrollToBottom = () => {
    try {
      outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
    } catch {}
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;
    setError('');
    setInput('');

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);

    // 预先插入一个空的 assistant 占位，便于边流式边显示
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    setStreaming(true);
    let acc = '';

    try {
      await chatRequest(newMessages, { model, stream: true }, (delta) => {
        acc += delta;
        setMessages(prev => {
          const cloned = [...prev];
          // 找到最后一条 assistant 信息，并更新其 content
          for (let i = cloned.length - 1; i >= 0; i--) {
            if (cloned[i].role === 'assistant') {
              cloned[i] = { ...cloned[i], content: acc };
              break;
            }
          }
          return cloned;
        });
        scrollToBottom();
      });
    } catch (e) {
      console.error(e);
      setError(typeof e?.message === 'string' ? e.message : '请求失败');
      // 移除空的 assistant 占位
      setMessages(prev => prev.filter((_, idx) => idx !== prev.length - 1));
    } finally {
      setStreaming(false);
    }
  };

  const onClear = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="ai-chat-wrap">
      <div className="ai-chat-header">
        <div className="left">
          <strong>智能对话</strong>
          <span className="hint"> · 使用智谱AI {model}</span>
        </div>
        <div className="right">
          <label>
            模型：
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="glm-4.5">glm-4.5（高质量）</option>
              <option value="glm-4.5-flash">glm-4.5-flash（低延迟）</option>
            </select>
          </label>
          <button onClick={onClear} disabled={streaming} style={{ marginLeft: 8 }}>清空</button>
        </div>
      </div>

      <div ref={outputRef} className="ai-chat-output">
        {messages.length === 0 && (
          <div className="empty">开始与 AI 对话吧～</div>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`msg ${m.role}`}>
            <div className="role">{m.role === 'user' ? '我' : 'AI'}</div>
            <div className="content">{m.content}</div>
          </div>
        ))}
      </div>

      <div className="ai-chat-input">
        <textarea
          placeholder="请输入内容，Shift+Enter 换行，Enter 发送"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
        />
        <button className="send" onClick={onSend} disabled={!canSend}>发送</button>
      </div>

      {error && <div className="ai-chat-error">{error}</div>}

      {/* 简单样式 */}
      <style>{`
        .ai-chat-wrap { display:flex; flex-direction:column; height: calc(100vh - 140px); }
        .ai-chat-header { display:flex; justify-content:space-between; align-items:center; padding:8px 0; }
        .ai-chat-header .hint { color:#666; font-weight:normal; }
        .ai-chat-output { flex:1; overflow:auto; border:1px solid #eee; padding:10px; border-radius:6px; background:#fafafa; }
        .ai-chat-output .empty { color:#888; text-align:center; padding:40px 0; }
        .msg { display:flex; gap:10px; padding:8px 10px; margin-bottom:10px; border-radius:6px; }
        .msg.user { background:#e8f0fe; }
        .msg.assistant { background:#f5f5f5; }
        .msg .role { font-weight:bold; min-width:28px; color:#333; }
        .msg .content { white-space:pre-wrap; }
        .ai-chat-input { display:flex; gap:10px; margin-top:10px; }
        .ai-chat-input textarea { flex:1; resize:vertical; min-height:60px; max-height:160px; }
        .ai-chat-input .send { width:96px; }
        .ai-chat-error { color:#b00020; margin-top:8px; }
      `}</style>
    </div>
  );
}


