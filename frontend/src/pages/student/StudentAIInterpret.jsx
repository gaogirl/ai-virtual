import React, { useEffect, useMemo, useRef, useState } from 'react';
import { translateRequest } from '../../services/ai';
import evalAPI from '../../services/eval';
import './Student.css';

export default function StudentAIInterpret() {
  const [direction, setDirection] = useState('zh-en'); // zh-en | en-zh
  const [src, setSrc] = useState('');
  const [refText, setRefText] = useState('');
  const [myText, setMyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null); // {overall, accuracy, fidelity, fluency, grammar, suggestions}
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const targetLang = useMemo(() => (direction === 'zh-en' ? 'en' : 'zh'), [direction]);
  const sourceLocale = direction === 'zh-en' ? 'zh-CN' : 'en-US';
  const targetLocale = direction === 'zh-en' ? 'en-US' : 'zh-CN';

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    streamRef.current?.getTracks?.().forEach(track => track.stop());
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    window.speechSynthesis?.cancel();
  }, [recordingUrl]);

  const speakSource = () => {
    if (!src.trim()) { setErr('请先输入原文'); return; }
    if (!window.speechSynthesis) { setErr('当前浏览器不支持语音朗读'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(src);
    utterance.lang = sourceLocale;
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const toggleDictation = () => {
    if (listening) {
      recognitionRef.current?.stop?.();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setErr('当前浏览器不支持语音转写，请使用最新版 Chrome 或 Edge'); return; }
    const recognition = new Recognition();
    const originalText = myText.trim();
    recognition.lang = targetLocale;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => { setErr(''); setListening(true); };
    recognition.onend = () => setListening(false);
    recognition.onerror = event => { setListening(false); setErr(`语音转写失败：${event.error}`); };
    recognition.onresult = event => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) transcript += event.results[i][0].transcript;
      setMyText([originalText, transcript].filter(Boolean).join(originalText ? ' ' : ''));
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleRecording = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErr('当前浏览器不支持麦克风录音');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        setRecordingUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setRecording(false);
      };
      recorder.onerror = () => { setRecording(false); setErr('录音失败，请检查麦克风权限'); };
      recorderRef.current = recorder;
      streamRef.current = stream;
      recorder.start();
      setErr('');
      setRecording(true);
    } catch {
      setErr('无法使用麦克风，请在浏览器地址栏允许录音权限');
    }
  };

  const genReference = async () => {
    if (!src.trim()) return;
    setErr('');
    setLoading(true);
    try {
      const data = await translateRequest(src, { targetLanguage: targetLang, stream: false, model: 'glm-4.5' });
      setRefText(data.translation || '');
    } catch (e) {
      setErr(e?.message || '生成参考译文失败');
    } finally { setLoading(false); }
  };

  const clearAll = () => {
    recognitionRef.current?.stop?.();
    recorderRef.current?.state === 'recording' && recorderRef.current.stop();
    setSrc(''); setRefText(''); setMyText(''); setResult(null); setErr('');
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl('');
  };

  const onEvaluate = async () => {
    if (!src.trim() || !myText.trim()) { setErr('请先输入原文与译文'); return; }
    setLoading(true); setErr(''); setResult(null);
    try {
      const resp = await evalAPI.evaluateTranslation({ direction, sourceText: src, studentText: myText, refText });
      const data = resp.data || resp;
      setResult(data.result || null);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || '评估失败');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="card" style={{marginBottom:12}}>
        <div className="card-head"><span>翻译质量评估系统</span><span className="note"> 基于AI的智能翻译评估工具</span></div>
        <div className="grid two" style={{gap:12}}>
          <div className="card">
            <div className="card-head"><span>翻译方向</span></div>
            <div>
              <label style={{display:'block', marginBottom:6}}>
                <input type="radio" name="dir" checked={direction==='zh-en'} onChange={()=>setDirection('zh-en')} /> 中文 → 英文
              </label>
              <label style={{display:'block'}}>
                <input type="radio" name="dir" checked={direction==='en-zh'} onChange={()=>setDirection('en-zh')} /> 英文 → 中文
              </label>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span>原文</span></div>
            <textarea placeholder="请输入需要翻译的原文…" value={src} onChange={e=>setSrc(e.target.value)} />
          </div>
        </div>

        <div className="row" style={{gap:8, marginTop:8}}>
          <button className="btn" onClick={speakSource} disabled={loading}>朗读原文</button>
          <button className="btn" onClick={genReference} disabled={loading}>生成参考译文</button>
          <button className="btn primary" onClick={onEvaluate} disabled={loading}>开始评估</button>
          <button className="btn ghost" onClick={clearAll} disabled={loading}>清空内容</button>
          {err && <span className="note" style={{color:'#e03131'}}>{err}</span>}
        </div>
      </div>

      <div className="grid two" style={{gap:12}}>
        <div className="card">
          <div className="card-head">
            <span>我的口译</span>
            <button className={`btn ${listening ? 'primary' : ''}`} onClick={toggleDictation} type="button">
              {listening ? '停止转写' : '语音转写'}
            </button>
          </div>
          <textarea placeholder="请输入自己的译文…" value={myText} onChange={e=>setMyText(e.target.value)} />
          <div className="speech-tools">
            <button className={`btn ${recording ? 'primary' : ''}`} onClick={toggleRecording} type="button">
              {recording ? '停止录音' : '录制口译'}
            </button>
            {recording && <span className="recording-state">正在录音</span>}
            {recordingUrl && <audio className="practice-audio" src={recordingUrl} controls />}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span>参考译文</span></div>
          <textarea placeholder="尚未生成参考译文…" value={refText} onChange={e=>setRefText(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="card-head"><span>AI 评估建议</span></div>
        {!result ? <div className="note">AI 评估结果将在此处显示…</div> : (
          <div style={{whiteSpace:'pre-wrap'}}>{result.suggestions || '无'}</div>
        )}
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="card-head"><span>评分可视化</span></div>
        {!result ? (
          <div className="note">等待评估后展示</div>
        ) : (
          <div className="score-grid">
            {['overall','accuracy','fidelity','fluency','grammar'].map(key => (
              <div key={key} className="card">
                <div className="card-head"><span>{key.toUpperCase()}</span></div>
                <div style={{fontSize:28, fontWeight:800}}>{typeof result[key]==='number'?result[key]:'—'}</div>
                <div className="score-track">
                  <div className="score-fill" style={{width:`${Math.max(0, Math.min(100, Number(result[key]||0)))}%`}} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
