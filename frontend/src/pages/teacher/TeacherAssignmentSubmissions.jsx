import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import assignmentsAPI from '../../services/assignments';
import './Teacher.css';

export default function TeacherAssignmentSubmissions() {
  const { aid } = useParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await assignmentsAPI.submissionsOf(aid);
        const data = res.data || res;
        setList(data || []);
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || '获取提交列表失败');
      } finally { setLoading(false); }
    })();
  }, [aid]);

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>提交列表</span></div>
        <div style={{ marginBottom: 10 }}>
          <Link className="btn" to="/teacher/assignments">返回作业管理</Link>
        </div>
        {err && <div className="note" style={{ color:'#e03131', marginBottom:8 }}>{err}</div>}
        {loading ? (
          <div>加载中…</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left' }}>学生</th>
                <th style={{ textAlign:'left' }}>邮箱</th>
                <th style={{ textAlign:'left' }}>状态</th>
                <th style={{ textAlign:'left' }}>总分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {(list || []).map(s => (
                <tr key={s._id}>
                  <td>{s.student?.name || '-'}</td>
                  <td>{s.student?.email || '-'}</td>
                  <td>{s.status}</td>
                  <td>{typeof s.totalScore === 'number' ? s.totalScore : '-'}</td>
                  <td style={{ textAlign:'center' }}>
                    <Link className="btn" to={`/teacher/submissions/${s._id}`}>进入批改</Link>
                  </td>
                </tr>
              ))}
              {(list || []).length === 0 && (
                <tr><td colSpan={5}>暂无提交</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

