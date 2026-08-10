import React, { useState } from 'react';
import { chatRequest } from '../../services/ai';
import './Teacher.css';

export default function TeacherCourseGenerator() {
  const [form, setForm] = useState({ topic: '国际会议口译', level: '中级', duration: '45', focus: '术语准备、数字信息与逻辑衔接' });
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const generate = async () => {
    if (!form.topic.trim()) { setError('请输入课程主题'); return; }
    setLoading(true);
    setError('');
    try {
      const prompt = `请为口译教师生成一份可直接审核修改的课程包。\n主题：${form.topic}\n学习者水平：${form.level}\n课时：${form.duration}分钟\n训练重点：${form.focus}\n\n请使用中文 Markdown，严格包含：学习目标、课前准备、课堂流程（含时间分配）、核心术语表（中英对照）、3道递进练习、参考答案或评分要点、课后巩固。内容要具体，避免空泛说明。`;
      const response = await chatRequest([
        { role: 'system', content: '你是口译课程设计助手。生成内容必须经过教师审核后才能发布。' },
        { role: 'user', content: prompt },
      ], { model: 'glm-4.5-flash', stream: false, temperature: 0.4 });
      setContent(response?.content || '');
    } catch (err) {
      setError(err?.message || '课程包生成失败');
    } finally {
      setLoading(false);
    }
  };

  const copyContent = async () => {
    try { await navigator.clipboard.writeText(content); } catch { setError('复制失败，请手动选择文本'); }
  };

  const downloadContent = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${form.topic.trim() || '口译课程包'}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page course-generator-page">
      <section className="course-generator-intro">
        <div><span>AI LESSON STUDIO</span><h1>智能备课</h1><p>生成课程结构、术语清单和递进练习，教师审核后再用于教学。</p></div>
        <b>内容由智谱 AI 生成</b>
      </section>
      <div className="course-generator-grid">
        <section className="card course-generator-form">
          <div className="card-head">课程参数</div>
          <label>课程主题<input value={form.topic} onChange={update('topic')} /></label>
          <div className="grid two">
            <label>学习者水平<select value={form.level} onChange={update('level')}><option>初级</option><option>中级</option><option>高级</option></select></label>
            <label>课时（分钟）<input type="number" min="15" max="180" value={form.duration} onChange={update('duration')} /></label>
          </div>
          <label>训练重点<textarea value={form.focus} onChange={update('focus')} /></label>
          <button className="btn primary" onClick={generate} disabled={loading}>{loading ? '正在生成…' : '生成课程包'}</button>
          {error && <div className="generator-error">{error}</div>}
        </section>
        <section className="card course-generator-output">
          <div className="card-head"><span>课程包草稿</span>{content && <div className="actions"><button className="btn" onClick={copyContent}>复制</button><button className="btn" onClick={downloadContent}>下载</button></div>}</div>
          {content ? <textarea aria-label="课程包草稿" value={content} onChange={(event) => setContent(event.target.value)} /> : <div className="generator-empty"><strong>等待生成</strong><span>课程包将在这里显示，并可直接修改。</span></div>}
        </section>
      </div>
    </div>
  );
}
