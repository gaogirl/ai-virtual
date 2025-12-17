import React, { useEffect, useState } from 'react';
import libraryAPI from '../../services/library';
import './TeacherLibrary.css';

const CATS = ['材料学','生命科学','农业学','环境科学','旅游','教育学','心理学','社会学','金融'];

export default function TeacherTerms() {
  const [key, setKey] = useState('');
  const [cat, setCat] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ id: null, term: '', meaning: '', cat: CATS[0] });

  const fetchTerms = async () => {
    setLoading(true); setErr('');
    try {
      const res = await libraryAPI.listTerms({ key, cat, page:1, pageSize:300 });
      const data = res.data || res;
      setList(data.list || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '加载失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTerms(); /* eslint-disable-next-line */ }, []);

  const onSave = async () => {
    const { id, term, meaning, cat } = form;
    if (!term.trim() || !meaning.trim()) return;
    try {
      if (id) {
        await libraryAPI.updateTerm(id, { term, meaning, cat });
      } else {
        await libraryAPI.createTerm({ term, meaning, cat });
      }
      setForm({ id: null, term: '', meaning: '', cat: CATS[0] });
      await fetchTerms();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || '保存失败');
    }
  };

  const onEdit = (t) => setForm({ id: t._id, term: t.term, meaning: t.meaning, cat: t.cat || CATS[0] });
  const onDel = async (t) => {
    if (!confirm('确定删除该术语？')) return;
    try { await libraryAPI.deleteTerm(t._id); await fetchTerms(); } catch (e) { alert(e?.response?.data?.error || e?.message || '删除失败'); }
  };

  return (
    <div className="page-narrow" style={{ padding:'20px' }}>
      <div className="cardX" style={{ marginBottom:12 }}>
        <div className="searchbar">
          <input placeholder="🔍 搜索术语/释义…" value={key} onChange={e=>setKey(e.target.value)} />
          <button className="btn" onClick={fetchTerms}>搜索</button>
        </div>
        <div className="chips">
          <span className={!cat? 'chip active':'chip'} onClick={()=>{ setCat(''); setTimeout(fetchTerms,0); }}>全部</span>
          {CATS.map(c => (
            <span key={c} className={cat===c? 'chip active':'chip'} onClick={()=>{ setCat(c); setTimeout(fetchTerms,0); }}>{c}</span>
          ))}
        </div>
        {err && <div className="note" style={{color:'#e03131'}}>{err}</div>}
      </div>

      <div className="cardX" style={{ marginBottom:12 }}>
        <div className="row" style={{ gap:8, marginBottom:8 }}>
          <input placeholder="术语" value={form.term} onChange={e=>setForm(f=>({ ...f, term:e.target.value }))} />
          <select value={form.cat} onChange={e=>setForm(f=>({ ...f, cat:e.target.value }))}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="row" style={{ gap:8 }}>
          <textarea placeholder="释义" value={form.meaning} onChange={e=>setForm(f=>({ ...f, meaning:e.target.value }))} />
        </div>
        <div className="actions">
          <button className="btn primary" onClick={onSave}>{form.id ? '保存修改' : '新增术语'}</button>
          {form.id && <button className="btn ghost" onClick={()=>setForm({ id:null, term:'', meaning:'', cat:CATS[0] })}>取消编辑</button>}
        </div>
      </div>

      {loading ? <div>加载中…</div> : (
        <div className="cards">
          {(list || []).map((t) => (
            <div key={t._id} className="cardX">
              <div className="title">{t.term}</div>
              <div className="meta">{t.cat || '未分类'}</div>
              <div style={{ marginTop:6, whiteSpace:'pre-wrap' }}>{t.meaning}</div>
              <div className="actions">
                <button className="btn" onClick={()=>onEdit(t)}>编辑</button>
                <button className="btn" style={{ background:'#ff6b6b', color:'#fff' }} onClick={()=>onDel(t)}>删除</button>
              </div>
            </div>
          ))}
          {(!list || list.length===0) && <div className="note">暂无术语</div>}
        </div>
      )}
    </div>
  );
}

