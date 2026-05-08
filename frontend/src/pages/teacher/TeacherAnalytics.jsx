import React, { useEffect, useState } from 'react';
import classesAPI from '../../services/classes';
import './Teacher.css';

export default function TeacherAnalytics() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

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

  const fetchBoard = async () => {
    if (!classId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await classesAPI.dashboard(classId);
      setBoard(res.data || res);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '获取数据看板失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBoard(); /* eslint-disable-next-line */ }, [classId]);

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>数据看板</span></div>
        <div className="row" style={{ gap: 8, marginBottom: 12 }}>
          <select value={classId} onChange={e=>setClassId(e.target.value)}>
            {(classes || []).map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <a className="btn" href={classId?`/teacher/classes/${classId}`:'#'} style={{ textDecoration:'none' }}>前往班级</a>
        </div>

        {err && <div className="note" style={{ color:'#e03131', marginBottom:8 }}>{err}</div>}
        {loading ? <div>加载中…</div> : (
          <div className="grid two">
            <div className="card">
              <div className="card-head"><span>核心指标</span></div>
              {board ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                  <div className="card"><div className="card-head"><span>成员数</span></div><div style={{ fontSize:28, fontWeight:800 }}>{board.membersCount}</div></div>
                  <div className="card"><div className="card-head"><span>作业数</span></div><div style={{ fontSize:28, fontWeight:800 }}>{board.assignmentsCount}</div></div>
                  <div className="card"><div className="card-head"><span>完成率</span></div><div style={{ fontSize:28, fontWeight:800 }}>{(board.completionRate*100).toFixed(0)}%</div></div>
                  <div className="card"><div className="card-head"><span>平均分</span></div><div style={{ fontSize:28, fontWeight:800 }}>{board.averageScore}</div></div>
                </div>
              ) : (
                <div>暂无数据</div>
              )}
            </div>

            <div className="card">
              <div className="card-head"><span>常见错误</span></div>
              {board && (board.commonMistakes || []).length ? (
                <ul style={{ margin:0, paddingLeft:16 }}>
                  {board.commonMistakes.map((x,i)=>(<li key={i}>{x}</li>))}
                </ul>
              ) : (
                <div>暂无</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

