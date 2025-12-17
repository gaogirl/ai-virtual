import React, { useEffect, useState } from 'react';
import classesAPI from '../../services/classes';
import { useNavigate } from 'react-router-dom';
import './Student.css';

export default function StudentClasses() {
  const [invite, setInvite] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const fetchMine = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await classesAPI.mine();
      setList(res.data || res);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '获取班级失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMine(); }, []);

  const onJoin = async () => {
    const code = invite.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,8}$/.test(code)) {
      setErr('请输入6-8位字母数字邀请码');
      return;
    }
    setJoining(true);
    setErr('');
    try {
      await classesAPI.join({ code });
      setInvite('');
      await fetchMine();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '加入失败');
    } finally { setJoining(false); }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>我的班级</span></div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <input value={invite} onChange={e=>setInvite(e.target.value)} placeholder="输入邀请码加入（6-8位字母数字）" />
          <button className="btn primary" onClick={onJoin} disabled={joining}>{joining ? '加入中…' : '加入班级'}</button>
        </div>
        {err && <div className="note" style={{ color:'#e03131', marginBottom:8 }}>{err}</div>}
        {loading ? (
          <div>加载中…</div>
        ) : (
          <div className="grid three">
            {(list || []).map(cls => (
              <div key={cls._id} className="card" style={{ cursor:'pointer' }} onClick={()=>navigate(`/student/classes/${cls._id}`)}>
                <div className="card-head">
                  <span>{cls.name}</span>
                </div>
                <div>教师：{cls?.teacher?.name || '-'}</div>
                <div>学科：{cls.subject || '-'}</div>
                <div>人数：{cls.membersCount ?? '-'}</div>
                <div style={{ color:'#555', marginTop:6 }}>
                  最新作业：{cls.latestAssignment ? `${cls.latestAssignment.title}` : '暂无'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

