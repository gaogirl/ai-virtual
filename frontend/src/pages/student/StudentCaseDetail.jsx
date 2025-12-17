import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import libraryAPI from '../../services/library';
import './StudentLibrary.css';

export default function StudentCaseDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('');
      try {
        const res = await libraryAPI.getCase(id);
        setData(res.data || res);
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || '加载失败');
      } finally { setLoading(false); }
    })();
  }, [id]);

  return (
    <div className="page-narrow" style={{ padding:'20px' }}>
      <div className="actions" style={{ marginBottom:10 }}>
        <Link className="btn" to="/student/cases">返回列表</Link>
      </div>
      {loading ? <div>加载中…</div> : err ? (
        <div className="note" style={{ color:'#e03131' }}>{err}</div>
      ) : data ? (
        <div className="cardX">
          <div className="title" style={{ fontSize:20 }}>{data.title}</div>
          <div className="meta">领域：{data.domain || '—'} · 标签：{(data.tags||[]).join('、') || '—'}</div>
          {data.summary && <div style={{ marginTop:10 }} className="note">{data.summary}</div>}
          <div style={{ marginTop:12, whiteSpace:'pre-wrap' }}>{data.content || '暂无正文'}</div>
        </div>
      ) : null}
    </div>
  );
}

