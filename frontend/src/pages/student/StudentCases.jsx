import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import libraryAPI from '../../services/library';
import './StudentLibrary.css';

export default function StudentCases() {
  const [key, setKey] = useState('');
  const [domain, setDomain] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchCases = async () => {
    setLoading(true); setErr('');
    try {
      const res = await libraryAPI.listCases({ key, domain, page:1, pageSize:30 });
      const data = res.data || res;
      setList(data.list || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '加载失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCases(); /* eslint-disable-next-line */ }, []);

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

      {loading ? <div>加载中…</div> : (
        <div className="cards">
          {(list || []).map((c) => (
            <div key={c._id} className="cardX">
              <div className="title">{c.title}</div>
              <div className="meta">领域：{c.domain || '—'}</div>
              <div style={{marginTop:6, minHeight:50}} className="note">{c.summary || '暂无摘要'}</div>
              <div className="actions">
                <Link className="btn primary" to={`/student/cases/${c._id}`}>查看详情</Link>
              </div>
            </div>
          ))}
          {(!list || list.length===0) && <div className="note">暂无案例</div>}
        </div>
      )}
    </div>
  );
}

