import React, { useEffect, useMemo, useState } from 'react';
import classesAPI from '../../services/classes';
import assignmentsAPI from '../../services/assignments';
import './Teacher.css';

export default function TeacherAssignments() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'zh-en', dueAt: '', retryLimit: 1, allowViewRef: false, textBlock: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await classesAPI.teaching();
        const data = res.data || res;
        setClasses(data || []);
        if ((data || []).length && !classId) setClassId(String(data[0]._id));
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || '加载班级失败');
      }
    })();
  }, []);

  const fetchAssignments = async () => {
    if (!classId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await assignmentsAPI.listForClass(classId, { page, pageSize });
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '获取作业列表失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(); /* eslint-disable-next-line */ }, [classId, page, pageSize]);

  const parseQuestions = () => {
    const lines = (form.textBlock || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    return lines.map(line => {
      const [promptText, referenceAnswer] = line.split('||');
      return { type: form.type, promptText: promptText.trim(), referenceAnswer: (referenceAnswer || '').trim() };
    });
  };

  const onCreateAssn = async () => {
    if (!classId) { setErr('请先选择班级'); return; }
    if (!form.title.trim()) { setErr('请填写作业标题'); return; }
    const qs = parseQuestions();
    if (!qs.length) { setErr('请至少录入一题'); return; }
    setCreating(true);
    setErr('');
    try {
      const payload = {
        classId,
        title: form.title,
        type: form.type,
        questions: qs,
        retryLimit: Number(form.retryLimit) || 1,
        allowViewRef: !!form.allowViewRef,
      };
      if (form.dueAt) payload.dueAt = form.dueAt;
      await assignmentsAPI.create(payload);
      setForm({ title: '', type: form.type, dueAt: '', retryLimit: 1, allowViewRef: false, textBlock: '' });
      await fetchAssignments();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '创建作业失败');
    } finally { setCreating(false); }
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>作业管理</span></div>
        <div className="row" style={{ gap: 8, marginBottom: 12 }}>
          <select value={classId} onChange={e=>{ setClassId(e.target.value); setPage(1); }}>
            {(classes || []).map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <a className="btn" href={classId?`/teacher/classes/${classId}`:'#'} style={{ textDecoration:'none' }}>前往班级</a>
        </div>

        <div className="card" style={{ marginTop: 8 }}>
          <div className="card-head"><span>创建作业</span></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:8 }}>
            <input placeholder="标题*" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
              <option value="zh-en">中译英</option>
              <option value="en-zh">英译中</option>
              <option value="read">英文朗读</option>
            </select>
            <input type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form, dueAt:e.target.value})} />
            <input type="number" min="1" value={form.retryLimit} onChange={e=>setForm({...form, retryLimit:Number(e.target.value)})} placeholder="重试次数" />
            <label style={{ gridColumn:'span 4' }}>
              <input type="checkbox" checked={form.allowViewRef} onChange={e=>setForm({...form, allowViewRef:e.target.checked})} /> 允许查看参考答案
            </label>
          </div>
          <textarea
            placeholder={form.type==='read' ? '每行一段英文，供学生朗读（参考答案可留空）' : '每行一题，若包含“||”则左侧为题目文本，右侧为参考答案。例如：\n今天天气很好。||The weather is nice today.'}
            value={form.textBlock}
            onChange={e=>setForm({...form, textBlock:e.target.value})}
            style={{ width:'100%', minHeight:120 }}
          />
          <div style={{ marginTop:8 }}>
            <button className="btn primary" onClick={onCreateAssn} disabled={creating || !classId}>{creating ? '创建中…' : '创建作业'}</button>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-head"><span>作业列表</span></div>
          {err && <div className="note" style={{ color:'#e03131', marginBottom:8 }}>{err}</div>}
          {loading ? <div>加载中…</div> : (
            <div>
              {(list || []).length === 0 ? (
                <div>暂无作业</div>
              ) : (
                (list || []).map(a => (
                  <div key={a._id} className="card" style={{ marginBottom:8 }}>
                    <div className="card-head">
                      <span>{a.title}</span>
                      <span style={{ fontSize:12, color:'#666' }}>类型：{a.type}</span>
                    </div>
                    {a.dueAt && <div>截止：{new Date(a.dueAt).toLocaleString()}</div>}
                    <div style={{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap' }}>
                      <a className="btn" href={`/student/assignments/${a._id}`} style={{ textDecoration:'none' }}>以学生视角查看</a>
                      <a className="btn ghost" href={`/teacher/assignments/${a._id}/submissions`} style={{ textDecoration:'none' }}>查看提交列表</a>
                      <details>
                        <summary className="btn ghost" style={{ cursor:'pointer' }}>编辑</summary>
                        <div style={{ marginTop:8 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                            <input placeholder="标题" defaultValue={a.title} id={`title-${a._id}`} />
                            <select defaultValue={a.type} id={`type-${a._id}`}>
                              <option value="zh-en">中译英</option>
                              <option value="en-zh">英译中</option>
                              <option value="read">英文朗读</option>
                            </select>
                            <input type="datetime-local" defaultValue={a.dueAt?new Date(a.dueAt).toISOString().slice(0,16):''} id={`due-${a._id}`} />
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginTop:8 }}>
                            <input type="number" min="1" defaultValue={a.retryLimit||1} id={`retry-${a._id}`} placeholder="重试次数" />
                            <label style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <input type="checkbox" defaultChecked={a.allowViewRef} id={`ref-${a._id}`} /> 允许查看参考答案
                            </label>
                          </div>
                          <div style={{ marginTop:8 }}>
                            <textarea id={`qs-${a._id}`} style={{ width:'100%', minHeight:100 }}
                              placeholder={a.type==='read'?'每行一段英文（参考可空）':'每行一题，题目||参考答案'}
                              defaultValue={(a.questions||[]).map(q=>`${q.promptText}${q.referenceAnswer?`||${q.referenceAnswer}`:''}`).join('\n')} />
                          </div>
                          <div style={{ marginTop:8, display:'flex', gap:8 }}>
                            <button className="btn primary" onClick={async()=>{
                              try{
                                const title = document.getElementById(`title-${a._id}`).value;
                                const type = document.getElementById(`type-${a._id}`).value;
                                const dueAt = document.getElementById(`due-${a._id}`).value;
                                const retryLimit = Number(document.getElementById(`retry-${a._id}`).value||1);
                                const allowViewRef = document.getElementById(`ref-${a._id}`).checked;
                                const textBlock = document.getElementById(`qs-${a._id}`).value;
                                const lines = (textBlock||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
                                const questions = lines.map(line=>{ const [p,r] = line.split('||'); return { type, promptText:p.trim(), referenceAnswer:(r||'').trim() }; });
                                await assignmentsAPI.update(a._id, { title, type, dueAt, retryLimit, allowViewRef, questions });
                                alert('已保存');
                                await fetchAssignments();
                              }catch(err){ alert(err?.response?.data?.error||err?.message||'保存失败'); }
                            }}>保存</button>
                            <button className="btn" style={{ background:'#ff6b6b', color:'#fff' }} onClick={async()=>{
                              if(!confirm('确定删除该作业吗？此操作不可恢复')) return;
                              try{ await assignmentsAPI.remove(a._id); await fetchAssignments(); }catch(err){ alert(err?.response?.data?.error||err?.message||'删除失败'); }
                            }}>删除</button>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                ))
              )}

              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button>
                <span>第 {page} / {pages} 页</span>
                <button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>下一页</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

