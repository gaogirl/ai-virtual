import React, { useEffect, useState } from 'react';
import './Student.css';
import { translateRequest } from '../../services/ai';
import learningProfileAPI from '../../services/learningProfile';

// 语言映射到代码
const toLangCode = (name) => {
  switch (name) {
    case '中文': return 'zh';
    case '英文': return 'en';
    case '日文': return 'ja';
    default: return 'auto';
  }
};

const AIAssessCard = ({ score, loading }) => {
  const level = typeof score === 'number' ? (score >= 85 ? '优秀' : score >= 70 ? '良好' : '待提升') : '暂无数据';
  return (
    <div className="card assess-card">
      <div className="card-head">
        <span>个人能力 AI 评测</span>
      </div>
      <div className="assess-content">
        <div className="assess-score">
          <div className="score-num">{loading ? '…' : (score ?? '--')}</div>
          <div className="score-sub">综合得分</div>
        </div>
        <div className="assess-meta">
          <div>等级：<b>{level}</b></div>
          <div>{typeof score === 'number' ? '该得分来自已评分作业，完成新练习后会自动更新。' : '完成作业并等待评分后，这里将显示你的真实综合得分。'}</div>
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
  const [profileScore, setProfileScore] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;
    learningProfileAPI.mine()
      .then((response) => {
        const profile = response?.data?.data || response?.data || response;
        const summary = profile?.summary || profile?.totals || {};
        if (active) setProfileScore(summary.averageScore ?? null);
      })
      .catch(() => { if (active) setProfileScore(null); })
      .finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, []);

  const onTranslate = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await translateRequest(src, {
        sourceLanguage: toLangCode(from),
        targetLanguage: toLangCode(to),
        model: 'glm-4.5',
        stream: false,
      });
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
        <AIAssessCard score={profileScore} loading={profileLoading} />
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
