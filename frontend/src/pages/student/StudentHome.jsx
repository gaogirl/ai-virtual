import React, { useState } from 'react';
import './Student.css';
import { API_BASE } from '../../services/ai';

// 语言映射到代码
const toLangCode = (name) => {
  switch (name) {
    case '中文': return 'zh';
    case '英文': return 'en';
    case '日文': return 'ja';
    default: return 'auto';
  }
};

const AIAssessCard = ({ score = 78 }) => {
  const level = score >= 85 ? '优秀' : score >= 70 ? '良好' : '待提升';
  return (
    <div className="card assess-card">
      <div className="card-head">
        <span>个人能力 AI 评测</span>
      </div>
      <div className="assess-content">
        <div className="assess-score">
          <div className="score-num">{score}</div>
          <div className="score-sub">综合得分</div>
        </div>
        <div className="assess-meta">
          <div>等级：<b>{level}</b></div>
          <div>口译技巧：<span className="tag ok">笔记</span> <span className="tag ok">信息提取</span> <span className="tag">术语</span></div>
          <div>建议：加强专业术语积累与复述能力训练</div>
        </div>
      </div>
    </div>
  );
};

const StudentHome = () => {
  const [from, setFrom] = useState('中文');
  const [to, setTo] = useState('英文');
  const [src, setSrc] = useState('');
  const [dst, setDst] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onTranslate = async () => {
    setLoading(true);
    setErr('');
    try {
      const body = {
        text: src,
        sourceLang: toLangCode(from),
        targetLang: toLangCode(to),
        model: 'glm-4.5',
        stream: false,
      };
      const resp = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(await resp.text().catch(()=> '翻译失败'));
      const data = await resp.json();
      setDst(data.translation || '');
    } catch (e) {
      setErr(typeof e?.message === 'string' ? e.message : '翻译失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="grid two">
        <AIAssessCard />
        <div className="card">
          <div className="card-head">
            <span>人工智能辅助翻译</span>
          </div>
          <div className="trans-toolbar">
            <div className="selects">
              <label>源语言
                <select value={from} onChange={e=>setFrom(e.target.value)}>
                  <option>中文</option>
                  <option>英文</option>
                  <option>日文</option>
                </select>
              </label>
              <label>目标语言
                <select value={to} onChange={e=>setTo(e.target.value)}>
                  <option>中文</option>
                  <option>英文</option>
                  <option>日文</option>
                </select>
              </label>
            </div>
            <button className="btn primary" onClick={onTranslate} disabled={loading}>{loading ? '翻译中…' : '翻译'}</button>
          </div>
          {err && <div className="note" style={{marginBottom:8,color:'#e03131'}}>{err}</div>}
          <div className="trans-area">
            <textarea placeholder="请输入待翻译文本…" value={src} onChange={e=>setSrc(e.target.value)} />
            <textarea placeholder="译文将显示在此…" value={dst} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
