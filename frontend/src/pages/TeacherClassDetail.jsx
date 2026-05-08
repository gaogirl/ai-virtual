import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import classesAPI from '../services/classes';
import assignmentsAPI from '../services/assignments';

export default function TeacherClassDetail() {
  const { id } = useParams();
  const [info, setInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // 作业相关
  const [assnList, setAssnList] = useState([]);
  const [assnPage, setAssnPage] = useState(1);
  const [assnTotal, setAssnTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'zh-en', dueAt: '', retryLimit: 1, allowViewRef: false, textBlock: '' });

  const fetchAll = async () => {
    setLoading(true);
    setErr('');
    try {
      const [detailRes, membersRes, boardRes, assnRes] = await Promise.all([
        classesAPI.detail(id),
        classesAPI.members(id),
        classesAPI.dashboard(id),
        assignmentsAPI.listForClass(id, { page: assnPage, pageSize: 20 }),
      ]);
      setInfo(detailRes.data || detailRes);
      setMembers((membersRes.data || membersRes).members || []);
      setBoard(boardRes.data || boardRes);
      const data = assnRes.data || assnRes;
      setAssnList(data.list || []);
      setAssnTotal(data.total || 0);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '加载失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [id, assnPage]);

  const onRemove = async (uid) => {
    if (!confirm('确定移除此学生吗？')) return;
    try {
      await classesAPI.removeMember(id, uid);
      await fetchAll();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || '移除失败');
    }
  };

  const parseQuestions = () => {
    // 每行一题；若包含 "||"，则左侧为提示文本，右侧为参考答案
    const lines = (form.textBlock || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    return lines.map(line => {
      const [promptText, referenceAnswer] = line.split('||');
      return { type: form.type, promptText: promptText.trim(), referenceAnswer: (referenceAnswer || '').trim() };
    });
  };

  const onCreateAssn = async () => {
    if (!form.title.trim()) { setErr('请填写作业标题'); return; }
    const qs = parseQuestions();
    if (!qs.length) { setErr('请至少录入一题'); return; }
    setCreating(true);
    setErr('');
    try {
      const payload = {
        classId: id,
        title: form.title,
        type: form.type,
        questions: qs,
        retryLimit: Number(form.retryLimit) || 1,
        allowViewRef: !!form.allowViewRef,
      };
      if (form.dueAt) payload.dueAt = form.dueAt;
      await assignmentsAPI.create(payload);
      setForm({ title: '', type: form.type, dueAt: '', retryLimit: 1, allowViewRef: false, textBlock: '' });
      await fetchAll();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '创建作业失败');
    } finally { setCreating(false); }
  };

  const pages = Math.max(1, Math.ceil(assnTotal / 20));

  return (
    <div className="page">
      <div className="card">
        <div className="card-head"><span>班级详情（教师）</span></div>
        {loading && <div>加载中…</div>}
        {err && <div className="note" style={{ color:'#e03131' }}>{err}</div>}
        {info && (
          <div style={{ marginBottom:12 }}>
            <div><b>{info.name}</b>（{info.subject || '未知学科'}） · 学习周期：{info.period || '—'} · 人数：{info.membersCount ?? '-'}
            </div>
          </div>
        )}

        <div className="grid two">
          <div className="card">
            <div className="card-head"><span>成员管理</span></div>
            {(members || []).length === 0 ? (
              <div>暂无学生</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign:'left' }}>姓名</th>
                    <th style={{ textAlign:'left' }}>邮箱</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m._id}>
                      <td>{m.name}</td>
                      <td>{m.email}</td>
                      <td style={{ textAlign:'center' }}>
                        <button onClick={()=>onRemove(m._id)}>移除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="card-head"><span>数据看板</span></div>
            {board ? (
              <div>
                <div>成员数：{board.membersCount}</div>
                <div>作业数：{board.assignmentsCount}</div>
                <div>完成率：{(board.completionRate*100).toFixed(0)}%</div>
                <div>平均分：{board.averageScore}</div>
                <div style={{ marginTop:8 }}>
                  常见错误：
                  {(board.commonMistakes || []).length === 0 ? (
                    <span>暂无</span>
                  ) : (
                    <ul>
                      {board.commonMistakes.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div>暂无数据</div>
            )}
          </div>
        </div>

        <div className="card" style={{ marginTop:12 }}>
          <div className="card-head"><span>布置作业</span></div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:8 }}>
            <input placeholder="标题*" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            <select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}>
              <option value="zh-en">中译英</option>
              <option value="en-zh">英译中</option>
              <option value="read">英文朗读</option>
            </select>
            <input type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form, dueAt:e.target.value})} />
            <input type="number" min="1" value={form.retryLimit} onChange={e=>setForm({...form, retryLimit:Number(e.target.value)})} placeholder="重试次数" />
            <label style={{ gridColumn:'span 4' }}>
              <input type="checkbox" checked={form.allowViewRef} onChange={e=>setForm({...form, allowViewRef:e.target.checked})} /> 允许查看参考答案
            </label>
          </div>
          <div>
            <textarea
              placeholder={form.type==='read' ? '每行一段英文，供学生朗读（参考答案可留空）' : '每行一题，若包含“||”则左侧为题目文本，右侧为参考答案。例如：\n今天天气很好。||The weather is nice today.'}
              value={form.textBlock}
              onChange={e=>setForm({...form, textBlock:e.target.value})}
              style={{ width:'100%', minHeight:120 }}
            />
          </div>
          <div style={{ marginTop:8 }}>
            <button className="btn primary" onClick={onCreateAssn} disabled={creating}>{creating ? '创建中…' : '创建作业'}</button>
          </div>
        </div>

        <div className="card" style={{ marginTop:12 }}>
          <div className="card-head"><span>作业列表</span></div>
          {(assnList || []).length === 0 ? (
            <div>暂无作业</div>
          ) : (
            <div>
              {(assnList || []).map(a => (
                <div key={a._id} className="card" style={{ marginBottom:8 }}>
                  <div className="card-head">
                    <span>{a.title}</span>
                    <span style={{ fontSize:12, color:'#666' }}>类型：{a.type}</span>
                  </div>
                  {a.dueAt && <div>截止：{new Date(a.dueAt).toLocaleString()}</div>}
                  <div style={{ marginTop:6, display:'flex', gap:8, flexWrap:'wrap' }}>
                    <a className="btn" href={`/student/assignments/${a._id}`} style={{ textDecoration:'none' }}>以学生视角查看</a>
                    <button onClick={async()=>{
                      const res = await assignmentsAPI.submissionsOf(a._id);
                      const subs = res.data || res;
                      alert(`提交数：${(subs || []).length}`);
                    }}>查看提交数量</button>
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button disabled={assnPage<=1} onClick={()=>setAssnPage(p=>Math.max(1,p-1))}>上一页</button>
                <span>第 {assnPage} / {Math.max(1, Math.ceil(assnTotal/20))} 页</span>
                <button disabled={assnPage>=Math.ceil(assnTotal/20)} onClick={()=>setAssnPage(p=>p+1)}>下一页</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

