import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import classesAPI from '../../services/classes';
import assignmentsAPI from '../../services/assignments';
import './Student.css';

const STATUS_LABELS = {
  all: '全部',
  pending: '待完成',
  in_progress: '进行中',
  submitted: '已提交',
  graded: '已批改',
};

export default function StudentClassDetail() {
  const { id } = useParams(); // classId
  const [info, setInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await classesAPI.detail(id);
        setInfo(res.data || res);
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || '获取班级详情失败');
      }
    })();
  }, [id]);

  const fetchAssignments = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await assignmentsAPI.listForClass(id, { page, pageSize });
      const data = res.data || res;
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '获取作业列表失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(); /* eslint-disable-next-line */ }, [id, page, pageSize]);

  const filtered = useMemo(() => {
    if (status === 'all') return list;
    return (list || []).filter(x => (x.status || 'pending') === status);
  }, [list, status]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>班级详情</span></div>
        {info ? (
          <div style={{ marginBottom: 12 }}>
            <div><b>{info.name}</b>（{info.subject || '未知学科'}） · 人数：{info.membersCount ?? '-'}</div>
            {info.latestAssignment && (
              <div style={{ color:'#555' }}>最新作业：{info.latestAssignment.title}</div>
            )}
          </div>
        ) : (
          <div>加载中…</div>
        )}

        <div style={{ display:'flex', gap:8, alignItems:'center', margin:'8px 0' }}>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <button key={k} className={`btn ${status===k?'primary':''}`} onClick={()=>{ setStatus(k); setPage(1); }}>{v}</button>
          ))}
        </div>

        {err && <div className="note" style={{ color:'#e03131', marginBottom:8 }}>{err}</div>}

        {loading ? <div>加载中…</div> : (
          <div>
            {(filtered || []).map(item => (
              <div key={item._id} className="card" style={{ marginBottom:8 }}>
                <div className="card-head">
                  <span>{item.title}</span>
                  <span style={{ fontSize:12, color:'#666' }}>类型：{item.type}</span>
                </div>
                <div>状态：{STATUS_LABELS[item.status] || '待完成'}</div>
                {typeof item.myScore === 'number' && (
                  <div>我的分数：{item.myScore}</div>
                )}
                {item.dueAt && <div>截止：{new Date(item.dueAt).toLocaleString()}</div>}
                <div style={{ marginTop:6 }}>
                  <a className="btn" href={`/student/assignments/${item._id}`} style={{ textDecoration:'none' }}>进入作业</a>
                </div>
              </div>
            ))}

            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button>
              <span>第 {page} / {pages} 页</span>
              <button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

