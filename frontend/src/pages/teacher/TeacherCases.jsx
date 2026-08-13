import React, { useEffect, useState } from 'react';
import libraryAPI from '../../services/library';
import './TeacherLibrary.css';

export default function TeacherCases() {
  const [key, setKey] = useState('');
  const [domain, setDomain] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({ id: null, title: '', domain: '', tags: '', summary: '', content: '' });

  const fetchCases = async () => {
    setLoading(true); setErr('');
    try {
      const res = await libraryAPI.listCases({ key, domain, page:1, pageSize:50 });
      const data = res.data || res;
      setList(data.list || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '加载失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCases(); /* eslint-disable-next-line */ }, []);

  const onSave = async () => {
    const payload = {
      title: form.title,
      domain: form.domain,
      summary: form.summary,
      content: form.content,
      tags: (form.tags || '').split(',').map(s=>s.trim()).filter(Boolean)
    };
    if (!payload.title?.trim()) return alert('请填写标题');
    try {
      if (form.id) {
        await libraryAPI.updateCase(form.id, payload);
      } else {
        await libraryAPI.createCase(payload);
      }
      setForm({ id: null, title: '', domain: '', tags: '', summary: '', content: '' });
      await fetchCases();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || '保存失败');
    }
  };

  const onEdit = async (c) => {
    try {
      const res = await libraryAPI.getCase(c._id);
      const d = res.data || res;
      setForm({ id: d._id, title: d.title || '', domain: d.domain || '', tags: (d.tags||[]).join(','), summary: d.summary || '', content: d.content || '' });
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || '加载详情失败');
    }
  };

  const onDel = async (c) => {
    if (!confirm('确定删除该案例？')) return;
    try { await libraryAPI.deleteCase(c._id); await fetchCases(); } catch (e) { alert(e?.response?.data?.error || e?.message || '删除失败'); }
  };

  return (
    <div className="page-narrow" style={{ padding:'20px' }}>
      <div className="cardX" style={{ marginBottom:12 }}>
        <div className="searchbar">
          <input placeholder="🔍 搜索标题/领域/摘要…" value={key} onChange={e=>setKey(e.target.value)} />
          <input placeholder="筛选领域（可选）" value={domain} onChange={e=>setDomain(e.target.value)} />
          <button className="btn" onClick={fetchCases}>搜索</button>
        </div>
        {err && <div className="note" style={{color:'#e03131'}}>{err}</div>}
      </div>

      <div className="cardX" style={{ marginBottom:12 }}>
        <div className="row" style={{ gap:8, marginBottom:8 }}>
          <input placeholder="标题*" value={form.title} onChange={e=>setForm(f=>({ ...f, title:e.target.value }))} />
          <input placeholder="领域" value={form.domain} onChange={e=>setForm(f=>({ ...f, domain:e.target.value }))} />
          <input placeholder="标签（逗号分隔）" value={form.tags} onChange={e=>setForm(f=>({ ...f, tags:e.target.value }))} />
        </div>
        <div className="row" style={{ gap:8, marginBottom:8 }}>
          <textarea placeholder="摘要" value={form.summary} onChange={e=>setForm(f=>({ ...f, summary:e.target.value }))} />
        </div>
        <div className="row" style={{ gap:8 }}>
          <textarea placeholder="正文（支持纯文本/Markdown）" value={form.content} onChange={e=>setForm(f=>({ ...f, content:e.target.value }))} />
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onSave}>{form.id ? '保存修改' : '新增案例'}</button>
          {form.id && <button className="btn ghost" onClick={()=>setForm({ id:null, title:'', domain:'', tags:'', summary:'', content:'' })}>取消编辑</button>}
        </div>
      </div>

      {loading ? <div>加载中…</div> : (
        <div className="cards">
          {(list || []).map((c) => (
            <div key={c._id} className="cardX">
              <div className="title">{c.title}</div>
              <div className="meta">领域：{c.domain || '—'} · 标签：{(c.tags||[]).join('、') || '—'}</div>
              <div style={{marginTop:6, minHeight:50}} className="note">{c.summary || '暂无摘要'}</div>
              <div className="actions">
                <button className="btn" onClick={()=>onEdit(c)}>编辑</button>
                <button className="btn" style={{ background:'#ff6b6b', color:'#fff' }} onClick={()=>onDel(c)}>删除</button>
              </div>
            </div>
          ))}
          {(!list || list.length===0) && <div className="note">暂无案例</div>}
        </div>
      )}
    </div>
  );
}

