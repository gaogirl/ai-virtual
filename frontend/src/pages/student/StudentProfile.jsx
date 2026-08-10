import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import learningProfileAPI from '../../services/learningProfile';
import './Student.css';

const typeLabels = {
  'zh-en': '中译英',
  'en-zh': '英译中',
  read: '朗读',
};

const unwrapProfile = (response) => response?.data?.data || response?.data || response;

const getProfileParts = (profile) => ({
  summary: profile?.summary || profile?.totals || {},
  byType: profile?.byType || profile?.directionScores || {},
  recommendations: profile?.recommendations || profile?.suggestions || [],
  recentActivity: profile?.recentActivity || [],
});

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value));
};

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    learningProfileAPI.mine()
      .then((response) => { if (active) setProfile(unwrapProfile(response)); })
      .catch((err) => { if (active) setError(err?.response?.data?.error || '学习画像加载失败，请稍后重试'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="card profile-state">正在生成学习画像…</div>;
  if (error) return <div className="card profile-state error-state">{error}</div>;

  const { summary, byType, recommendations, recentActivity } = getProfileParts(profile);
  const submissionCount = summary.submissions ?? summary.submissionCount ?? 0;
  const gradedCount = summary.graded ?? summary.gradedCount ?? 0;
  const averageScore = summary.averageScore ?? null;
  const typeEntries = Object.entries(byType).filter(([, score]) => typeof score === 'number');

  if (!submissionCount) {
    return (
      <div className="card profile-state">
        <div className="card-head">学习画像</div>
        <strong>完成第一份作业后，这里会形成你的能力画像</strong>
        <p className="meta">系统会根据真实提交与评分，整理分项能力、近期表现和练习建议。</p>
        <Link className="btn primary" to="/student/classes">查看班级作业</Link>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <section className="profile-summary" aria-label="学习概览">
        <div><span>综合得分</span><strong>{averageScore ?? '暂无'}</strong></div>
        <div><span>提交作业</span><strong>{submissionCount}</strong></div>
        <div><span>已评分</span><strong>{gradedCount}</strong></div>
      </section>

      <div className="grid two">
        <section className="card">
          <div className="card-head">分项能力</div>
          {typeEntries.length ? (
            <div className="ability-list">
              {typeEntries.map(([type, score]) => (
                <div className="ability-row" key={type}>
                  <div><span>{typeLabels[type] || type}</span><strong>{score} 分</strong></div>
                  <div className="ability-track"><span style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <div className="profile-empty">作业已有提交，等待教师评分后显示分项能力。</div>}
        </section>

        <section className="card">
          <div className="card-head">练习建议</div>
          {recommendations.length ? (
            <ol className="recommendation-list">
              {recommendations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
            </ol>
          ) : <div className="profile-empty">当前没有新增建议，继续完成练习以更新画像。</div>}
        </section>
      </div>

      <section className="card profile-activity">
        <div className="card-head">近期学习活动</div>
        {recentActivity.length ? (
          <div className="activity-list">
            {recentActivity.map((item, index) => (
              <div className="activity-row" key={item.submissionId || `${item.assignmentId}-${index}`}>
                <div>
                  <strong>{item.title || '口译作业'}</strong>
                  <div className="meta">{typeLabels[item.type] || item.type || '综合练习'} · {formatDate(item.updatedAt)}</div>
                </div>
                <span className={typeof item.score === 'number' ? 'activity-score' : 'tag'}>
                  {typeof item.score === 'number' ? `${item.score} 分` : '待评分'}
                </span>
              </div>
            ))}
          </div>
        ) : <div className="profile-empty">暂无近期活动，去班级完成一份作业吧。</div>}
      </section>
    </div>
  );
}
