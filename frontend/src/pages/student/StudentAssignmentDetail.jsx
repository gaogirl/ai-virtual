import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import assignmentsAPI from '../../services/assignments';
import libraryAPI from '../../services/library';
import './Student.css';

export default function StudentAssignmentDetail() {
  const { id } = useParams(); // assignmentId
  const [detail, setDetail] = useState(null);
  const [answers, setAnswers] = useState({}); // {index: { text?: string, audioUrl?: string }}
  const [submitting, setSubmitting] = useState(false);
  const [submitRes, setSubmitRes] = useState(null);
  const [err, setErr] = useState('');

  const [refTerms, setRefTerms] = useState([]);
  const [refCases, setRefCases] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await assignmentsAPI.detail(id);
        const d = res.data || res;
        setDetail(d);
        // 初始化答案
        const init = {};
        (d.questions || []).forEach((q, i) => {
          init[i] = q.type === 'read' ? { audioUrl: '' } : { text: '' };
        });
        setAnswers(init);
        // 加载参考术语/案例
        if ((d.termIds || []).length) {
          try {
            const tr = await libraryAPI.listTerms({ ids: (d.termIds || []).join(',') });
            setRefTerms((tr.data || tr).list || []);
          } catch {}
        }
        if ((d.caseIds || []).length) {
          try {
            const cr = await libraryAPI.listCases({ ids: (d.caseIds || []).join(',') });
            // listCases 返回精简字段已足够展示
            setRefCases((cr.data || cr).list || []);
          } catch {}
        }
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || '获取作业详情失败');
      }
    })();
  }, [id]);

  const uploadAudio = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const resp = await fetch('/api/upload/audio', { method: 'POST', body: fd });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    return data.url; // /uploads/xxx
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setErr('');
    setSubmitRes(null);
    try {
      const payload = {
        answers: Object.entries(answers)
          .sort((a,b)=>Number(a[0])-Number(b[0]))
          .map(([index,obj]) => ({ index: Number(index), text: obj?.text, audioUrl: obj?.audioUrl }))
      };
      const res = await assignmentsAPI.submit(id, payload);
      setSubmitRes(res.data || res);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '提交失败');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>作业详情</span></div>
        {detail ? (
          <div>
            <div style={{ marginBottom: 8 }}>
              <b>{detail.title}</b> · 类型：{detail.type}
              {detail.dueAt && <span style={{ marginLeft:8 }}>截止：{new Date(detail.dueAt).toLocaleString()}</span>}
            </div>
            {(detail.questions || []).map((q, idx) => (
              <div key={idx} className="card" style={{ marginBottom: 8 }}>
                <div className="card-head"><span>第 {idx+1} 题（{q.type}）</span></div>
                <div style={{ whiteSpace:'pre-wrap', marginBottom:8 }}>{q.promptText}</div>
                {q.type === 'read' ? (
                  <div>
                    <div className="note" style={{ color:'#555' }}>请录音并上传音频文件（wav/mp3 等，文件大小受服务器限制）。</div>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={async (e)=>{
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadAudio(file);
                          setAnswers(prev => ({ ...prev, [idx]: { ...(prev[idx]||{}), audioUrl: url } }));
                        } catch (er) {
                          setErr(er?.message || '音频上传失败');
                        }
                      }}
                    />
                    {(answers[idx]?.audioUrl) && (
                      <div style={{ marginTop: 6 }}>
                        <audio src={answers[idx].audioUrl} controls />
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea
                    placeholder={q.type === 'zh-en' ? '请输入英文翻译…' : '请输入中文翻译…'}
                    value={answers[idx]?.text ?? ''}
                    onChange={e=>setAnswers(prev=>({ ...prev, [idx]: { ...(prev[idx]||{}), text: e.target.value } }))}
                  />
                )}
              </div>
            ))}

            {err && <div className="note" style={{ color:'#e03131', marginBottom:8 }}>{err}</div>}

            <button className="btn primary" onClick={onSubmit} disabled={submitting}>
              {submitting ? '提交中…' : '提交'}
            </button>

            {submitRes && (
              <div className="card" style={{ marginTop:12 }}>
                <div className="card-head"><span>提交结果</span></div>
                {typeof submitRes.totalScore === 'number' && (
                  <div>总分：{submitRes.totalScore}</div>
                )}
                <div style={{ marginTop:8 }}>
                  {(submitRes.answers || []).map((a, i) => (
                    <div key={i} className="card" style={{ marginBottom:6 }}>
                      <div className="card-head"><span>第 {a.index+1} 题</span></div>
                      {typeof a.score === 'number' && <div>评分：{a.score}</div>}
                      {a.feedback && <div style={{ whiteSpace:'pre-wrap' }}>反馈：{a.feedback}</div>}
                      {a.audioUrl && (
                        <div style={{ marginTop:6 }}>
                          <audio src={a.audioUrl} controls />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(refTerms.length>0 || refCases.length>0) && (
              <div className="card" style={{ marginTop:12 }}>
                <div className="card-head"><span>参考资料</span></div>
                {refTerms.length>0 && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ fontWeight:700, marginBottom:4 }}>参考术语</div>
                    <div className="list">
                      {refTerms.map(t=> (
                        <div key={t._id} className="item">
                          <div style={{ fontWeight:700 }}>{t.term}</div>
                          <div className="meta">{t.cat || '未分类'}</div>
                          <div style={{ marginTop:4 }}>{t.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {refCases.length>0 && (
                  <div>
                    <div style={{ fontWeight:700, marginBottom:4 }}>参考案例</div>
                    <div className="list">
                      {refCases.map(c=> (
                        <div key={c._id} className="item">
                          <div style={{ fontWeight:700 }}>{c.title}</div>
                          <div className="meta">领域：{c.domain || '—'} · 标签：{(c.tags||[]).join('、') || '—'}</div>
                          <div style={{ marginTop:4 }} className="note">{c.summary || '暂无摘要'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>加载中…</div>
        )}
      </div>
    </div>
  );
}
