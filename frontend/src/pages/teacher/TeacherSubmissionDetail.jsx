import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import submissionsAPI from '../../services/submissions';
import './Teacher.css';

export default function TeacherSubmissionDetail() {
  const { sid } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const [edits, setEdits] = useState({}); // {index: {score, feedback}}
  const [totalScore, setTotalScore] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');
      setOk('');
      try {
        const res = await submissionsAPI.getOne(sid);
        const data = res.data || res;
        setDetail(data);
        setComment(data.comment || '');
        setTotalScore(typeof data.totalScore === 'number' ? String(data.totalScore) : '');
        const map = {};
        (data.answers || []).forEach(a => {
          map[a.index] = { score: typeof a.score === 'number' ? a.score : '', feedback: a.feedback || '' };
        });
        setEdits(map);
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || '获取提交详情失败');
      } finally { setLoading(false); }
    })();
  }, [sid]);

  const qList = useMemo(() => detail?.assignment?.questions || [], [detail]);

  const onChangeScore = (idx, val) => {
    const n = val === '' ? '' : Number(val);
    if (n !== '' && (isNaN(n) || n < 0 || n > 100)) return; // 0-100
    setEdits(prev => ({ ...prev, [idx]: { ...(prev[idx]||{}), score: val === '' ? '' : n } }));
  };

  const onChangeFeedback = (idx, val) => {
    setEdits(prev => ({ ...prev, [idx]: { ...(prev[idx]||{}), feedback: val } }));
  };

  const onSave = async () => {
    setSaving(true);
    setErr('');
    setOk('');
    try {
      const answers = Object.entries(edits).map(([index, v]) => ({ index: Number(index), score: v.score === '' ? undefined : Number(v.score), feedback: v.feedback || undefined }));
      const payload = { answers };
      if (totalScore !== '') payload.totalScore = Number(totalScore);
      if (comment !== '') payload.comment = comment;
      await submissionsAPI.grade(sid, payload);
      setOk('已保存批改结果');
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '保存失败');
    } finally { setSaving(false); }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>批改作业</span></div>
        <div style={{ marginBottom:10 }}>
          <Link className="btn" to="/teacher/assignments">返回作业管理</Link>
        </div>
        {loading ? <div>加载中…</div> : detail ? (
          <div>
            <div className="card" style={{ marginBottom:12 }}>
              <div className="card-head"><span>基本信息</span></div>
              <div>学生：{detail.student?.name}（{detail.student?.email}）</div>
              <div>作业：{detail.assignment?.title}（{detail.assignment?.type}）</div>
              <div>状态：{detail.status}</div>
              <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
                <label>总分（0-100，可选）：
                  <input style={{ marginLeft:6 }} value={totalScore} onChange={e=>{
                    const v = e.target.value; if (v === '') return setTotalScore('');
                    const n = Number(v); if (!isNaN(n) && n>=0 && n<=100) setTotalScore(String(n));
                  }} />
                </label>
                <label style={{ flex:1 }}>总评：
                  <input className="input" style={{ width:'100%', marginLeft:6 }} value={comment} onChange={e=>setComment(e.target.value)} />
                </label>
              </div>
            </div>

            {(qList || []).map((q, idx) => {
              const ans = (detail.answers || []).find(a => Number(a.index) === idx);
              const edit = edits[idx] || { score:'', feedback:'' };
              return (
                <div key={idx} className="card" style={{ marginBottom:10 }}>
                  <div className="card-head"><span>第 {idx+1} 题（{q.type}）</span></div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <div style={{ fontWeight:700, marginBottom:6 }}>题目</div>
                      <div style={{ whiteSpace:'pre-wrap' }}>{q.promptText}</div>
                    </div>
                    <div>
                      {(q.type === 'zh-en' || q.type === 'en-zh') ? (
                        <>
                          <div style={{ fontWeight:700, marginBottom:6 }}>参考答案</div>
                          <div style={{ whiteSpace:'pre-wrap' }}>{q.referenceAnswer || '（无参考）'}</div>
                        </>
                      ) : (
                        <div className="note">朗读题：可在此显示参考示范或发音要点</div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontWeight:700, marginBottom:6 }}>学生答案</div>
                    {q.type === 'read' ? (
                      ans?.audioUrl ? (
                        <audio src={ans.audioUrl} controls />
                      ) : (
                        <div className="note">学生未上传音频</div>
                      )
                    ) : (
                      <div style={{ whiteSpace:'pre-wrap' }}>{ans?.text || '（无）'}</div>
                    )}
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:12, marginTop:10 }}>
                    <label>评分(0-100)
                      <input style={{ marginTop:6 }} value={edit.score} onChange={e=>onChangeScore(idx, e.target.value)} />
                    </label>
                    <label>评语
                      <textarea style={{ marginTop:6, minHeight:60 }} value={edit.feedback} onChange={e=>onChangeFeedback(idx, e.target.value)} />
                    </label>
                  </div>
                </div>
              )
            })}

            {err && <div className="note" style={{ color:'#e03131', marginTop:8 }}>{err}</div>}
            {ok && <div className="note" style={{ color:'#2b8a3e', marginTop:8 }}>{ok}</div>}
            <div style={{ marginTop:10 }}>
              <button className="btn primary" onClick={onSave} disabled={saving}>{saving ? '保存中…' : '保存批改'}</button>
            </div>
          </div>
        ) : (
          <div>未找到提交详情</div>
        )}
      </div>
    </div>
  );
}

