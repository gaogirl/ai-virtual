import React, { useMemo, useState } from 'react';
import { API_BASE } from '../../services/ai';
import evalAPI from '../../services/eval';
import './Student.css';

export default function StudentAIInterpret() {
  const [direction, setDirection] = useState('zh-en'); // zh-en | en-zh
  const [src, setSrc] = useState('');
  const [refText, setRefText] = useState('');
  const [myText, setMyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null); // {overall, accuracy, fidelity, fluency, grammar, suggestions}

  const targetLang = useMemo(() => (direction === 'zh-en' ? 'en' : 'zh'), [direction]);

  const genReference = async () => {
    if (!src.trim()) return;
    setErr('');
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: src, targetLang, stream: false, model: 'glm-4.5' })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setRefText(data.translation || '');
    } catch (e) {
      setErr(e?.message || '生成参考译文失败');
    } finally { setLoading(false); }
  };

  const clearAll = () => {
    setSrc(''); setRefText(''); setMyText(''); setResult(null); setErr('');
  };

  const onEvaluate = async () => {
    if (!src.trim() || !myText.trim()) { setErr('请先输入原文与译文'); return; }
    setLoading(true); setErr(''); setResult(null);
    try {
      const resp = await evalAPI.evaluateTranslation({ direction, sourceText: src, studentText: myText, refText });
      const data = resp.data || resp;
      setResult(data.result || null);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '评估失败');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="card" style={{marginBottom:12}}>
        <div className="card-head"><span>翻译质量评估系统</span><span className="note"> 基于AI的智能翻译评估工具</span></div>
        <div className="grid two" style={{gap:12}}>
          <div className="card">
            <div className="card-head"><span>翻译方向</span></div>
            <div>
              <label style={{display:'block', marginBottom:6}}>
                <input type="radio" name="dir" checked={direction==='zh-en'} onChange={()=>setDirection('zh-en')} /> 中文 → 英文
              </label>
              <label style={{display:'block'}}>
                <input type="radio" name="dir" checked={direction==='en-zh'} onChange={()=>setDirection('en-zh')} /> 英文 → 中文
              </label>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span>原文</span></div>
            <textarea placeholder="请输入需要翻译的原文…" value={src} onChange={e=>setSrc(e.target.value)} />
          </div>
        </div>

        <div className="row" style={{gap:8, marginTop:8}}>
          <button className="btn" onClick={genReference} disabled={loading}>生成参考译文</button>
          <button className="btn primary" onClick={onEvaluate} disabled={loading}>开始评估</button>
          <button className="btn ghost" onClick={clearAll} disabled={loading}>清空内容</button>
          {err && <span className="note" style={{color:'#e03131'}}>{err}</span>}
        </div>
      </div>

      <div className="grid two" style={{gap:12}}>
        <div className="card">
          <div className="card-head"><span>译文</span></div>
          <textarea placeholder="请输入自己的译文…" value={myText} onChange={e=>setMyText(e.target.value)} />
        </div>
        <div className="card">
          <div className="card-head"><span>参考译文</span></div>
          <textarea placeholder="尚未生成参考译文…" value={refText} onChange={e=>setRefText(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="card-head"><span>AI 评估建议</span></div>
        {!result ? <div className="note">AI 评估结果将在此处显示…</div> : (
          <div style={{whiteSpace:'pre-wrap'}}>{result.suggestions || '无'}</div>
        )}
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="card-head"><span>评分可视化</span></div>
        {!result ? (
          <div className="note">等待评估后展示</div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12}}>
            {['overall','accuracy','fidelity','fluency','grammar'].map(key => (
              <div key={key} className="card">
                <div className="card-head"><span>{key.toUpperCase()}</span></div>
                <div style={{fontSize:28, fontWeight:800}}>{typeof result[key]==='number'?result[key]:'—'}</div>
                <div style={{height:6, background:'#f1f3f5', borderRadius:6, marginTop:8}}>
                  <div style={{height:'100%', width:`${Math.max(0, Math.min(100, Number(result[key]||0)))}%`, background:'linear-gradient(135deg, #667eea, #764ba2)', borderRadius:6}} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

