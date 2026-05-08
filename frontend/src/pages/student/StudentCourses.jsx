import React, { useEffect, useState } from 'react';
import './Student.css';
import classesAPI from '../../services/classes';
import assignmentsAPI from '../../services/assignments';
import { Link } from 'react-router-dom';

export default function StudentCourses() {
  const [classes, setClasses] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('');
      try {
        const res = await classesAPI.mine();
        const cls = res.data || res;
        setClasses(cls || []);
        // 拉取每个班级最近作业
        const lists = await Promise.all((cls||[]).map(c =>
          assignmentsAPI.listForClass(c._id, { page: 1, pageSize: 5 })
            .then(r => ({ classId: c._id, className: c.name, list: (r.data||r).list || [] }))
            .catch(() => ({ classId: c._id, className: c.name, list: [] }))
        ));
        const merged = lists.flatMap(x =>
          x.list.map(a => ({ ...a, classId: x.classId, className: x.className }))
        ).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        setRecent(merged);
      } catch (e) {
        setErr(e?.response?.data?.error || e?.message || '加载失败');
      } finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="page">
      <div className="card section">
        <div className="titleline">
          <div className="card-head">学习快捷入口</div>
        </div>
        <div className="grid three">
          <Link className="card" to="/student/ai" style={{ textDecoration:'none' }}>
            <div className="card-head"><span>智译（对话）</span></div>
            <div className="note">与 AI 对话，进行问答与辅助写作</div>
          </Link>
          <Link className="card" to="/student/ai-interp" style={{ textDecoration:'none' }}>
            <div className="card-head"><span>AI 口译/评估</span></div>
            <div className="note">生成参考译文，进行质量评估与建议</div>
          </Link>
          <Link className="card" to="/student/terms" style={{ textDecoration:'none' }}>
            <div className="card-head"><span>术语库</span></div>
            <div className="note">浏览术语，按分类与关键词快速检索</div>
          </Link>
          <Link className="card" to="/student/cases" style={{ textDecoration:'none' }}>
            <div className="card-head"><span>案例库</span></div>
            <div className="note">浏览案例，查看详情与背景资料</div>
          </Link>
        </div>
      </div>

      <div className="card section">
        <div className="titleline">
          <div className="card-head">我的班级</div>
          <div className="note">共 {classes.length} 个班级</div>
        </div>
        {loading ? <div>加载中…</div> : (
          <div className="grid three">
            {(classes || []).slice(0,6).map(c => (
              <Link key={c._id} className="card" to={`/student/classes/${c._id}`} style={{ textDecoration:'none' }}>
                <div className="card-head"><span>{c.name}</span></div>
                <div>教师：{c.teacher?.name || '-'}</div>
                <div>人数：{c.membersCount ?? '-'}</div>
                <div className="note" style={{ marginTop:6 }}>
                  最新作业：{c.latestAssignment ? c.latestAssignment.title : '暂无'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card section">
        <div className="titleline">
          <div className="card-head">最近作业</div>
          <div className="note">跨班级最近 5 条</div>
        </div>
        {loading ? <div>加载中…</div> : (
          (recent || []).length === 0 ? <div className="note">暂无作业</div> : (
            <div className="list">
              {(recent || []).map(a => (
                <div key={a._id} className="item">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700 }}>{a.title}</div>
                      <div className="meta">班级：{a.className} · 类型：{a.type} · 截止：{a.dueAt ? new Date(a.dueAt).toLocaleString() : '—'}</div>
                    </div>
                    <Link className="btn primary" to={`/student/assignments/${a._id}`}>进入作业</Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {err && <div className="note" style={{ color:'#e03131', marginTop:8 }}>{err}</div>}
    </div>
  );
}
