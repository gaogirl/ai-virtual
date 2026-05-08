import React, { useEffect, useMemo, useState } from 'react';
import libraryAPI from '../../services/library';
import './StudentLibrary.css';

const CATS = ['材料学','生命科学','农业学','环境科学','旅游','教育学','心理学','社会学','金融'];

export default function StudentTerms() {
  const [key, setKey] = useState('');
  const [cat, setCat] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchTerms = async () => {
    setLoading(true); setErr('');
    try {
      const res = await libraryAPI.listTerms({ key, cat, page:1, pageSize:200 });
      const data = res.data || res;
      setList(data.list || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '加载失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTerms(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => list, [list]);

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

      {loading ? <div>加载中…</div> : (
        <div className="cards">
          {(filtered || []).map((t) => (
            <div key={t._id} className="cardX">
              <div className="title">{t.term}</div>
              <div className="meta">{t.cat || '未分类'}</div>
              <div style={{marginTop:8, whiteSpace:'pre-wrap'}}>{t.meaning}</div>
            </div>
          ))}
          {(!filtered || filtered.length===0) && <div className="note">暂无术语</div>}
        </div>
      )}
    </div>
  );
}

