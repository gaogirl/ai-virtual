import React, { useMemo } from 'react';
import './Student.css';

const AIAssessCard = ({ score = 82 }) => {
  const level = score >= 85 ? '优秀' : score >= 70 ? '良好' : '待提升';
  return (
    <div className="card">
      <div className="card-head">个人能力 AI 评测</div>
      <div className="assess-content">
        <div className="assess-score">
          <div className="score-num">{score}</div>
          <div className="score-sub">综合得分</div>
        </div>
        <div className="assess-meta">
          <div>等级：<b>{level}</b></div>
          <div>优势：<span className="tag ok">信息提炼</span> <span className="tag ok">表达清晰</span></div>
          <div>建议：术语积累、口语流畅度训练、情景复述</div>
        </div>
      </div>
    </div>
  );
};

// 折线图（学习进度：天/时长）
const LineChart = ({ data, width = 520, height = 240, padding = 28 }) => {
  const maxY = Math.max(...data.map(d => d.value), 1);
  const stepX = (width - padding * 2) / (data.length - 1);
  const scaleY = (val) => height - padding - (val / maxY) * (height - padding * 2);

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${padding + i * stepX} ${scaleY(d.value)}`).join(' ');

  return (
    <svg className="svg-box" viewBox={`0 0 ${width} ${height}`}> 
      {/* 坐标轴 */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e9ecef"/>
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e9ecef"/>
      {/* 网格线 */}
      {[0.25,0.5,0.75,1].map((t,idx)=>{
        const y = padding + (height - padding*2) * t;
        return <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f3f5"/>;
      })}
      {/* 线条 */}
      <path d={path} fill="none" stroke="#667eea" strokeWidth={3} />
      {/* 点 */}
      {data.map((d,i)=>{
        const cx = padding + i * stepX, cy = scaleY(d.value);
        return <g key={i}>
          <circle cx={cx} cy={cy} r={4} fill="#667eea" />
          <text x={cx} y={height - padding + 16} textAnchor="middle" fontSize="10" fill="#868e96">{d.label}</text>
        </g>
      })}
      {/* 纵轴最大值标签 */}
      <text x={padding - 8} y={padding} textAnchor="end" fontSize="10" fill="#868e96">{maxY}</text>
      <text x={padding - 8} y={height - padding} textAnchor="end" fontSize="10" fill="#868e96">0</text>
    </svg>
  );
};

// 雷达图（话题熟悉度）
const RadarChart = ({ labels, values, width = 360, height = 300 }) => {
  const cx = width / 2, cy = height / 2, r = Math.min(width, height) * 0.38;
  const max = Math.max(...values, 1);
  const angleStep = (Math.PI * 2) / labels.length;

  const points = values.map((v, i) => {
    const a = -Math.PI / 2 + angleStep * i; // 从上方开始
    const rr = (v / max) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });

  const ring = (ratio) => {
    const pts = labels.map((_, i) => {
      const a = -Math.PI / 2 + angleStep * i;
      const rr = r * ratio;
      return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
    });
    return pts.map((p,i)=>`${i===0?'M':'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';
  };

  const poly = points.map((p,i)=>`${i===0?'M':'L'} ${p[0]} ${p[1]}`).join(' ') + ' Z';

  return (
    <svg className="svg-box" viewBox={`0 0 ${width} ${height}`}>
      {/* 环形网格 */}
      {[0.25,0.5,0.75,1].map((t,i)=> (
        <path key={i} d={ring(t)} fill="none" stroke="#e9ecef"/>
      ))}
      {/* 轴线与标签 */}
      {labels.map((lab, i)=>{
        const a = -Math.PI / 2 + angleStep * i;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#f1f3f5" />
            <text x={x} y={y} fontSize="11" fill="#868e96" textAnchor="middle" dy={y<cy?-6:12}>{lab}</text>
          </g>
        );
      })}
      {/* 多边形 */}
      <path d={poly} fill="rgba(102,126,234,.25)" stroke="#667eea" strokeWidth={2} />
    </svg>
  );
};

const StudentProfile = () => {
  // 模拟学习进度数据（近 7 天学习时长，单位：小时）
  const progress = useMemo(() => ([
    { label: '周一', value: 1.2 },
    { label: '周二', value: 0.8 },
    { label: '周三', value: 1.5 },
    { label: '周四', value: 2.0 },
    { label: '周五', value: 0.6 },
    { label: '周六', value: 1.8 },
    { label: '周日', value: 2.2 },
  ]), []);

  const totalDays = progress.filter(p=>p.value>0).length;
  const totalHours = progress.reduce((s,p)=>s+p.value,0).toFixed(1);

  // 话题熟悉度（0~100）
  const radarLabels = ['经济','政治','文化','人物','生态','旅游'];
  const radarValues = [72, 64, 80, 58, 69, 75];

  return (
    <div className="page">
      <div className="grid two" style={{marginBottom: 18}}>
        <div className="card chart-card">
          <div className="chart-title">学习进度（学习天数 {totalDays} 天 / 总时长 {totalHours} 小时）</div>
          <LineChart data={progress} />
        </div>
        <div className="card chart-card">
          <div className="chart-title">话题熟悉度</div>
          <RadarChart labels={radarLabels} values={radarValues} />
        </div>
      </div>

      <AIAssessCard score={84} />
    </div>
  );
};

export default StudentProfile;




