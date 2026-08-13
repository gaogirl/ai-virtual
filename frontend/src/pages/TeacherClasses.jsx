import React, { useEffect, useState } from 'react';
import classesAPI from '../services/classes';

export default function TeacherClasses() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', period: '', inviteMaxUses: 0, inviteExpiresAt: '' });

  const fetchTeaching = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await classesAPI.teaching();
      setList(res.data || res);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '获取班级失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTeaching(); }, []);

  const onCreate = async () => {
    if (!form.name.trim()) return setErr('请填写班级名称');
    setCreating(true);
    setErr('');
    try {
      const payload = { ...form };
      if (!payload.inviteExpiresAt) delete payload.inviteExpiresAt;
      if (!payload.inviteMaxUses) payload.inviteMaxUses = 0;
      await classesAPI.create(payload);
      setForm({ name: '', subject: '', period: '', inviteMaxUses: 0, inviteExpiresAt: '' });
      await fetchTeaching();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '创建失败');
    } finally { setCreating(false); }
  };

  const onResetInvite = async (id) => {
    try {
      await classesAPI.resetInvite(id, {});
      await fetchTeaching();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || '重置邀请码失败');
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>班级管理</span></div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:12 }}>
          <input placeholder="班级名称*" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input placeholder="学科类型" value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} />
          <input placeholder="学习周期" value={form.period} onChange={e=>setForm({...form, period:e.target.value})} />
          <input placeholder="邀请码最大次数(0不限)" type="number" value={form.inviteMaxUses} onChange={e=>setForm({...form, inviteMaxUses:Number(e.target.value)})} />
          <input placeholder="邀请码截止时间(可选)" type="datetime-local" value={form.inviteExpiresAt} onChange={e=>setForm({...form, inviteExpiresAt:e.target.value})} />
        </div>
        <button className="btn primary" onClick={onCreate} disabled={creating}>{creating ? '创建中…' : '创建班级'}</button>
        {err && <div className="note" style={{ color:'#e03131', marginTop:8 }}>{err}</div>}
      </div>

      <div className="card" style={{ marginTop:12 }}>
        <div className="card-head"><span>我教的班级</span></div>
        {loading ? <div>加载中…</div> : (
          <div className="grid three">
            {(list || []).map(cls => (
              <div key={cls._id} className="card">
                <div className="card-head"><span>{cls.name}</span></div>
                <div>学科：{cls.subject || '-'}</div>
                <div>学习周期：{cls.period || '-'}</div>
                <div>人数：{cls.membersCount ?? '-'}</div>
                <div style={{ marginTop:6 }}>
                  <div>邀请码：<code>{cls.invite?.code || '—'}</code></div>
                  <div>有效期：{cls.invite?.expiresAt ? new Date(cls.invite.expiresAt).toLocaleString() : '不限'}</div>
                  <div>次数：{cls.invite?.maxUses ? `${cls.invite.maxUses}（已用${cls.invite?.usedCount||0}）` : '不限'}</div>

                  {/* 编辑班级信息 */}
                  <details style={{ marginTop:8 }}>
                    <summary style={{ cursor:'pointer' }}>编辑班级信息</summary>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:8 }}>
                      <input defaultValue={cls.name} placeholder="班级名称" onBlur={async (e)=>{ try{ await classesAPI.update(cls._id,{ name:e.target.value}); await fetchTeaching(); }catch(err){ alert(err?.response?.data?.error||err?.message||'更新失败'); } }} />
                      <input defaultValue={cls.subject||''} placeholder="学科类型" onBlur={async (e)=>{ try{ await classesAPI.update(cls._id,{ subject:e.target.value}); await fetchTeaching(); }catch(err){ alert(err?.response?.data?.error||err?.message||'更新失败'); } }} />
                      <input defaultValue={cls.period||''} placeholder="学习周期" onBlur={async (e)=>{ try{ await classesAPI.update(cls._id,{ period:e.target.value}); await fetchTeaching(); }catch(err){ alert(err?.response?.data?.error||err?.message||'更新失败'); } }} />
                    </div>
                  </details>

                  <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                    <button onClick={()=>navigator.clipboard.writeText(cls.invite?.code || '')}>复制邀请码</button>
                    <button onClick={()=>onResetInvite(cls._id)}>重置邀请码</button>
                    <a className="btn" href={`/teacher/classes/${cls._id}`} style={{ textDecoration:'none' }}>进入班级</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

