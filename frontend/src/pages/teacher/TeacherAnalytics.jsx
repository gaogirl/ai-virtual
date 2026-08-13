import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
        if ((data || []).length) setClassId((current) => current || String(data[0]._id));
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || '加载班级失败');
      }
    })();
  }, []);

  const fetchBoard = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setErr('');
    try {
      const res = await classesAPI.dashboard(classId);
      setBoard(res.data || res);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '获取数据看板失败');
    } finally { setLoading(false); }
  }, [classId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  const hasCompletionData = board?.hasCompletionData ?? ((board?.membersCount ?? 0) > 0 && (board?.assignmentsCount ?? 0) > 0);
  const hasScoreData = board?.hasScoreData ?? ((board?.gradedCount ?? 0) > 0);

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
          {classId && <Link className="btn" to={`/teacher/classes/${classId}`}>前往班级</Link>}
        </div>

        {err && <div className="note" style={{ color:'#e03131', marginBottom:8 }}>{err}</div>}
        {loading ? <div>加载中…</div> : (
          <div className="grid two">
            <div className="card">
              <div className="card-head"><span>核心指标</span></div>
              {board ? (
                <div className="analytics-metrics">
                  <div className="metric"><span>成员数</span><strong>{board.membersCount ?? 0}</strong></div>
                  <div className="metric"><span>作业数</span><strong>{board.assignmentsCount ?? 0}</strong></div>
                  <div className="metric"><span>完成率</span><strong>{hasCompletionData ? `${((board.completionRate ?? 0) * 100).toFixed(0)}%` : '暂无数据'}</strong></div>
                  <div className="metric"><span>平均分</span><strong>{hasScoreData ? board.averageScore : '暂无数据'}</strong></div>
                </div>
              ) : (
                <div className="analytics-empty">请选择已有班级查看教学数据。</div>
              )}
            </div>

            <div className="card">
              <div className="card-head"><span>常见错误</span></div>
              {board && (board.commonMistakes || []).length ? (
                <ul className="mistake-list">
                  {board.commonMistakes.map((x,i)=>(<li key={i}>{x}</li>))}
                </ul>
              ) : (
                <div className="analytics-empty">
                  {board?.assignmentsCount ? '当前反馈中尚未识别到可汇总的错误类型。' : '发布作业并完成批改后，这里会汇总高频问题。'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
