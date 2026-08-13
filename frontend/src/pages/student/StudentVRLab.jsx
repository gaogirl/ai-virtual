import React, { useEffect, useMemo, useState } from 'react';
import './StudentVRLab.css';

const SCENARIOS = [
  {
    id: 'un', code: 'CH-01', title: '联合国气候会议', context: '多边会议 · 英译中同传',
    role: '中文同传译员', duration: '08:00',
    stages: ['会前准备', '主席致辞', '国家发言', '决议总结'],
    prompts: [
      'Distinguished delegates, our shared response to climate change must be both ambitious and equitable.',
      'Developing economies require predictable financing and accessible technology to meet these targets.',
      'The draft resolution calls for transparent reporting and a review of progress every two years.'
    ],
    terms: ['equitable 公平合理的', 'predictable financing 可预期融资', 'draft resolution 决议草案']
  },
  {
    id: 'business', code: 'CH-02', title: '跨境商务谈判', context: '双边会谈 · 交替传译',
    role: '中方口译员', duration: '06:00',
    stages: ['背景确认', '报价磋商', '条款澄清', '达成共识'],
    prompts: [
      'Our proposed unit price includes logistics, but it is based on a minimum annual order of 20,000 units.',
      'We can accept a phased payment schedule if the first shipment is covered by a letter of credit.',
      'Let us record the revised delivery window and arrange a legal review of the agreement.'
    ],
    terms: ['minimum annual order 年度最低订购量', 'letter of credit 信用证', 'delivery window 交付周期']
  },
  {
    id: 'press', code: 'CH-03', title: '国际新闻发布会', context: '媒体问答 · 中译英口译',
    role: '新闻发言人译员', duration: '05:00',
    stages: ['开场陈述', '记者提问', '现场回应', '要点回顾'],
    prompts: [
      '本次合作将重点支持青年科研人员交流，并建立开放共享的联合实验平台。',
      '关于项目进度，我们将在完成独立评估后及时公布下一阶段安排。',
      '双方一致认为，应通过持续对话妥善处理分歧，扩大共同利益。'
    ],
    terms: ['联合实验平台 joint research platform', '独立评估 independent assessment', '妥善处理分歧 manage differences properly']
  }
];

const pad = (value) => String(value).padStart(2, '0');

export default function StudentVRLab() {
  const [selectedId, setSelectedId] = useState('un');
  const [status, setStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const scenario = useMemo(() => SCENARIOS.find((item) => item.id === selectedId) || SCENARIOS[0], [selectedId]);

  useEffect(() => {
    if (status !== 'running') return undefined;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const selectScenario = (id) => {
    setSelectedId(id);
    setStatus('idle');
    setSeconds(0);
    setStageIndex(0);
    setPromptIndex(0);
    setNotes('');
  };

  const minutes = `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  const isStarted = status !== 'idle';

  return (
    <div className="vr-page">
      <section className="vr-intro" aria-labelledby="vr-title">
        <div>
          <div className="vr-kicker"><span className="vr-live-dot" /> 情景训练实验室</div>
          <h1 id="vr-title">进入同传舱位，练习临场判断</h1>
          <p>选择任务，在限定场景中完成信息接收、笔记与口译节奏训练。</p>
        </div>
        <div className="vr-demo-label" role="note">演示模拟，不是真实 VR</div>
      </section>

      <section className="vr-scene-selector" aria-labelledby="scene-title">
        <div className="vr-section-heading">
          <div><span>训练频道</span><h2 id="scene-title">选择场景</h2></div>
          <p>本地演示数据 · 3 个可用频道</p>
        </div>
        <div className="vr-scene-grid">
          {SCENARIOS.map((item) => (
            <button type="button" key={item.id} className={`vr-scene-card ${selectedId === item.id ? 'is-selected' : ''}`} onClick={() => selectScenario(item.id)} aria-pressed={selectedId === item.id}>
              <span className="vr-scene-code">{item.code}</span>
              <strong>{item.title}</strong>
              <span>{item.context}</span>
              <span className="vr-scene-enter">{selectedId === item.id ? '当前频道' : '切换频道'} <b>→</b></span>
            </button>
          ))}
        </div>
      </section>

      <section className="vr-console" aria-labelledby="console-title">
        <div className="vr-console-topbar">
          <div><span>SIMULATION CONSOLE / {scenario.code}</span><h2 id="console-title">{scenario.title}</h2></div>
          <div className={`vr-status ${status}`}><span />{status === 'running' ? '训练进行中' : status === 'paused' ? '已暂停' : status === 'complete' ? '训练完成' : '频道待机'}</div>
        </div>

        <div className="vr-console-grid">
          <div className="vr-booth-panel">
            <div className={`vr-booth ${status === 'running' ? 'is-on-air' : ''}`}>
              <div className="vr-booth-ring ring-one" /><div className="vr-booth-ring ring-two" />
              <div className="vr-booth-core"><span>声道 A</span><strong>{minutes}</strong><small>{status === 'running' ? 'ON AIR' : 'STANDBY'}</small></div>
            </div>
            <dl className="vr-session-meta">
              <div><dt>你的角色</dt><dd>{scenario.role}</dd></div>
              <div><dt>建议时长</dt><dd>{scenario.duration}</dd></div>
              <div><dt>当前阶段</dt><dd>{scenario.stages[stageIndex]}</dd></div>
            </dl>
          </div>

          <div className="vr-workspace">
            <div className="vr-stage-track" aria-label="任务阶段">
              {scenario.stages.map((stage, index) => (
                <button type="button" key={stage} className={index === stageIndex ? 'active' : index < stageIndex ? 'done' : ''} onClick={() => isStarted && setStageIndex(index)} disabled={!isStarted}>
                  <span>{index + 1}</span>{stage}
                </button>
              ))}
            </div>

            {status === 'complete' ? (
              <div className="vr-feedback" role="status">
                <span>本地模拟反馈</span><h3>训练记录已完成</h3>
                <p>你持续训练了 {minutes}，记录 {notes.trim().length} 个字符。建议复盘口译中的数字、专有名词和逻辑连接词，并对照术语提示进行二次表达。</p>
                <button type="button" onClick={() => selectScenario(selectedId)}>重新训练</button>
              </div>
            ) : (
              <>
                <div className="vr-prompt">
                  <div className="vr-block-label"><span>原文提示</span><b>{pad(promptIndex + 1)} / {pad(scenario.prompts.length)}</b></div>
                  <blockquote>{scenario.prompts[promptIndex]}</blockquote>
                  <div className="vr-prompt-actions">
                    <button type="button" title="上一条提示" aria-label="上一条提示" onClick={() => setPromptIndex((value) => Math.max(0, value - 1))} disabled={!isStarted || promptIndex === 0}>←</button>
                    <button type="button" title="下一条提示" aria-label="下一条提示" onClick={() => setPromptIndex((value) => Math.min(scenario.prompts.length - 1, value + 1))} disabled={!isStarted || promptIndex === scenario.prompts.length - 1}>→</button>
                  </div>
                </div>
                <div className="vr-terms"><span>术语提示</span>{scenario.terms.map((term) => <b key={term}>{term}</b>)}</div>
                <label className="vr-notes"><span>译员笔记</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} disabled={!isStarted} placeholder="开始训练后，在这里记录数字、术语和逻辑关系……" /></label>
              </>
            )}
          </div>
        </div>

        {status !== 'complete' && (
          <div className="vr-console-actions">
            <p>{status === 'idle' ? '准备就绪后开启当前频道。' : '计时仅保存在当前浏览器页面。'}</p>
            <div>
              <button type="button" className="vr-control secondary" onClick={() => setStatus('complete')} disabled={!isStarted}>完成训练</button>
              <button type="button" className="vr-control primary" onClick={() => setStatus((current) => current === 'running' ? 'paused' : 'running')}>
                {status === 'running' ? 'Ⅱ  暂停' : status === 'paused' ? '▶  继续' : '▶  开始训练'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
