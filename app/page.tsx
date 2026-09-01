'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, CircleHelp, Download, Headphones, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { allBeats, courseBeats, famousBeats, type Beat, type CourseLevel, type Drum, type FamousLevel } from './beats';
import './enhancements.css';

const drumLabels: Record<Drum, string> = { hh: 'Hi-hat', snare: 'Snare', kick: 'Kick', tom: 'High tom' };
const noteY: Record<Drum, number> = { hh: 18, tom: 35, snare: 53, kick: 79 };
const courseLevels: CourseLevel[] = ['Beginner', 'Medium', 'Advanced'];
const famousLevels: FamousLevel[] = ['Easy', 'Medium', 'Hard'];

function Score({ beat, step, onScrub }: { beat: Beat; step: number; onScrub: (step: number) => void }) {
  const notes = useMemo(() => Array.from({ length: 16 }, (_, index) => (Object.keys(beat.pattern) as Drum[]).filter((drum) => beat.pattern[drum][index])), [beat]);
  return (
    <div className="score" aria-label={`Drum notation for ${beat.title}`}>
      <div className="score-meta"><span>Standard drum notation</span><span>4 / 4 · ♩ = {beat.bpm}</span></div>
      <div className="staff-wrap">
        <div className="staff-clef" aria-hidden="true">𝄥</div>
        <div className="staff" role="group" aria-label="Scrubbable one-bar drum score">
          {[20,35,50,65,80].map((top) => <span className="staff-line" style={{ top: `${top}%` }} key={top} />)}
          {notes.map((drums, index) => (
            <div className={`beat-column ${step === index ? 'is-current' : ''}`} style={{ left: `${(index + 0.55) * 6.05}%` }} key={index}>
              {index % 4 === 0 && <span className="beat-count">{index / 4 + 1}</span>}
              {drums.map((drum) => <span className={`note note-${drum}`} style={{ top: `${noteY[drum]}%` }} key={drum} title={drumLabels[drum]}>{drum === 'hh' ? '×' : '●'}</span>)}
              {index % 4 === 3 && index < 15 && <span className="measure-tick" />}
            </div>
          ))}
          <input className="score-scrubber" aria-label="Scrub through beat notes" type="range" min="0" max="15" step="1" value={Math.max(step, 0)} onChange={(event) => onScrub(Number(event.target.value))} />
        </div>
      </div>
      <div className="count-row" aria-hidden="true">{['1','e','&','a','2','e','&','a','3','e','&','a','4','e','&','a'].map((count, index) => <span key={`${count}-${index}`}>{count}</span>)}</div>
      <p className="scrub-hint">Drag across the score to audition each slice</p>
    </div>
  );
}

export default function Home() {
  const [collection, setCollection] = useState<'course' | 'famous'>('course');
  const [level, setLevel] = useState<CourseLevel | FamousLevel>('Beginner');
  const [selectedId, setSelectedId] = useState(courseBeats[0].id);
  const selectedBeat = allBeats.find((beat) => beat.id === selectedId) ?? courseBeats[0];
  const [bpm, setBpm] = useState(selectedBeat.bpm);
  const [volume, setVolume] = useState(72);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [manualHit, setManualHit] = useState<Drum | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  const visibleBeats = useMemo(() => (collection === 'course' ? courseBeats : famousBeats).filter((beat) => beat.level === level), [collection, level]);
  const levelOptions = collection === 'course' ? courseLevels : famousLevels;

  const playSound = useCallback((drum: Drum) => {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const context = audioRef.current ?? new AudioCtx(); audioRef.current = context;
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime; const gain = context.createGain(); gain.gain.setValueAtTime((volume / 100) * 0.8, now); gain.connect(context.destination);
    if (drum === 'kick' || drum === 'tom') {
      const osc = context.createOscillator(); const tone = context.createGain(); osc.type = 'sine';
      osc.frequency.setValueAtTime(drum === 'kick' ? 125 : 190, now); osc.frequency.exponentialRampToValueAtTime(drum === 'kick' ? 46 : 92, now + 0.18);
      tone.gain.setValueAtTime(1, now); tone.gain.exponentialRampToValueAtTime(0.001, now + (drum === 'kick' ? 0.42 : 0.28));
      osc.connect(tone).connect(gain); osc.start(now); osc.stop(now + 0.45); return;
    }
    const buffer = context.createBuffer(1, context.sampleRate * 0.25, context.sampleRate); const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = context.createBufferSource(); noise.buffer = buffer; const filter = context.createBiquadFilter();
    filter.type = drum === 'hh' ? 'highpass' : 'bandpass'; filter.frequency.value = drum === 'hh' ? 6500 : 1700;
    const envelope = context.createGain(); envelope.gain.setValueAtTime(drum === 'hh' ? 0.35 : 0.75, now); envelope.gain.exponentialRampToValueAtTime(0.001, now + (drum === 'hh' ? 0.07 : 0.2));
    noise.connect(filter).connect(envelope).connect(gain); noise.start(now); noise.stop(now + 0.22);
  }, [volume]);

  const playStep = useCallback((index: number) => {
    setStep(index);
    (Object.keys(selectedBeat.pattern) as Drum[]).forEach((drum) => { if (selectedBeat.pattern[drum][index]) playSound(drum); });
  }, [selectedBeat, playSound]);

  useEffect(() => {
    if (!playing) return;
    let current = step < 0 ? 0 : step;
    const tick = () => { playStep(current); current = (current + 1) % 16; };
    tick(); const timer = window.setInterval(tick, 60000 / bpm / 4); return () => window.clearInterval(timer);
  }, [playing, bpm, selectedBeat.id, playStep]);

  const chooseCollection = (next: 'course' | 'famous') => {
    const nextLevel = next === 'course' ? 'Beginner' : 'Easy'; const first = next === 'course' ? courseBeats[0] : famousBeats[0];
    setCollection(next); setLevel(nextLevel); setSelectedId(first.id); setBpm(first.bpm); setStep(-1); setPlaying(false);
  };
  const chooseLevel = (next: CourseLevel | FamousLevel) => {
    const first = (collection === 'course' ? courseBeats : famousBeats).find((beat) => beat.level === next);
    setLevel(next); if (first) { setSelectedId(first.id); setBpm(first.bpm); } setStep(-1); setPlaying(false);
  };
  const selectBeat = (beat: Beat) => { setSelectedId(beat.id); setBpm(beat.bpm); setStep(-1); setPlaying(false); };
  const hitDrum = (drum: Drum) => { playSound(drum); setManualHit(drum); window.setTimeout(() => setManualHit(null), 140); };
  const activeDrums = playing && step >= 0 ? (Object.keys(selectedBeat.pattern) as Drum[]).filter((drum) => selectedBeat.pattern[drum][step]) : manualHit ? [manualHit] : [];

  const updateDial = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    let angle = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI + 90;
    if (angle > 180) angle -= 360;
    const clamped = Math.max(-135, Math.min(135, angle)); setBpm(Math.round(50 + ((clamped + 135) / 270) * 100));
  };

  const exportPdf = async () => {
    const pdfTab = window.open('', '_blank'); if (!pdfTab) { window.alert('Please allow pop-ups to open the score PDF.'); return; }
    pdfTab.document.write('<title>Preparing score...</title><body style="font-family:Arial;padding:40px">Preparing your Drum Room score...</body>');
    setPdfBusy(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setProperties({ title: `${selectedBeat.title} - Drum Room`, subject: 'Printable drum partiture', creator: 'Drum Room' });
      doc.setFillColor(45, 54, 73); doc.roundedRect(12, 12, 273, 32, 4, 4, 'F'); doc.setFillColor(241, 83, 29); doc.rect(12, 12, 4, 32, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text(selectedBeat.title, 23, 27);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.text(`${selectedBeat.style.toUpperCase()}  /  ${selectedBeat.level.toUpperCase()}  /  ${bpm} BPM  /  4-4 TIME`, 23, 36);
      doc.setTextColor(35, 36, 38); doc.setFontSize(10); doc.text(selectedBeat.subtitle, 16, 56);
      const staffX = 34, staffY = 78, staffW = 245, gap = 8;
      doc.setDrawColor(45, 45, 45); doc.setLineWidth(0.35);
      for (let line = 0; line < 5; line += 1) doc.line(staffX, staffY + line * gap, staffX + staffW, staffY + line * gap);
      doc.setFontSize(18); doc.text('4', 18, staffY + 11); doc.text('4', 18, staffY + 26);
      const pdfY: Record<Drum, number> = { hh: staffY - 4, tom: staffY + gap, snare: staffY + gap * 2, kick: staffY + gap * 4.5 };
      for (let index = 0; index < 16; index += 1) {
        const x = staffX + 9 + index * (staffW - 18) / 15;
        if (index % 4 === 0) { doc.setFontSize(7); doc.setTextColor(125, 125, 125); doc.text(String(index / 4 + 1), x - 1, staffY - 13); doc.setTextColor(35, 36, 38); }
        if (index > 0 && index % 4 === 0) { doc.setLineWidth(0.6); doc.line(x - 7, staffY, x - 7, staffY + gap * 4); }
        (Object.keys(selectedBeat.pattern) as Drum[]).forEach((drum) => {
          if (!selectedBeat.pattern[drum][index]) return;
          const y = pdfY[drum]; doc.setDrawColor(25, 25, 25); doc.setFillColor(25, 25, 25); doc.setLineWidth(0.45);
          if (drum === 'hh') { doc.line(x - 1.7, y - 1.7, x + 1.7, y + 1.7); doc.line(x + 1.7, y - 1.7, x - 1.7, y + 1.7); }
          else doc.ellipse(x, y, 2.2, 1.45, 'F');
          doc.line(x + 2, y, x + 2, y - 11);
        });
      }
      doc.setDrawColor(200, 200, 198); doc.line(16, 134, 281, 134);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('NOTATION KEY', 16, 145); doc.setFont('helvetica', 'normal'); doc.setTextColor(85, 85, 85);
      doc.text('x  Hi-hat', 16, 154); doc.text('-  High tom', 62, 154); doc.text('-  Snare', 116, 154); doc.text('-  Kick', 160, 154);
      doc.setTextColor(241, 83, 29); doc.setFont('helvetica', 'bold'); doc.text('DRUM ROOM', 16, 190); doc.setTextColor(110, 110, 110); doc.setFont('helvetica', 'normal'); doc.text('Practice slowly. Keep your strokes relaxed. Raise the tempo only when the groove feels steady.', 42, 190);
      const url = URL.createObjectURL(doc.output('blob')); pdfTab.location.href = url; window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { pdfTab.close(); window.alert('The PDF could not be created. Please try again.'); }
    finally { setPdfBusy(false); }
  };

  return (
    <main className="app-shell">
      <aside className="groove-panel">
        <div className="brand-lockup"><span className="brand-mark">DR</span><div><strong>Drum Room</strong><small>Practice Studio</small></div></div>
        <div className="library-switch"><button className={collection === 'course' ? 'active' : ''} onClick={() => chooseCollection('course')}>Practice course</button><button className={collection === 'famous' ? 'active' : ''} onClick={() => chooseCollection('famous')}>Famous grooves</button></div>
        <div className="level-tabs">{levelOptions.map((option) => <button className={level === option ? 'active' : ''} key={option} onClick={() => chooseLevel(option)}>{option}</button>)}</div>
        <div className="panel-heading"><p>{collection === 'course' ? `${level} beats` : `${level} classics`}</p><span>{visibleBeats.length} tracks</span></div>
        <nav className="beat-list" aria-label="Drum beat library">{visibleBeats.map((beat, index) => <button className={`beat-card ${beat.id === selectedId ? 'selected' : ''}`} key={beat.id} onClick={() => selectBeat(beat)}><span className="beat-number">{String(index + 1).padStart(2, '0')}</span><span className="beat-copy"><strong>{beat.title}</strong><small>{beat.style} · {beat.level}</small></span><ChevronRight size={16} /></button>)}</nav>
        <div className="console-screen"><small>NOW PRACTICING</small><strong>{bpm}<em>BPM</em></strong><span>{selectedBeat.title.toUpperCase()}</span></div>
        <div className="dial-block">
          <div className="dial interactive" role="slider" aria-label="Tempo dial" aria-valuemin={50} aria-valuemax={150} aria-valuenow={bpm} tabIndex={0} style={{ '--dial': `${((bpm - 50) / 100) * 270 - 135}deg` } as React.CSSProperties} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateDial(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateDial(event); }} onKeyDown={(event) => { if (event.key === 'ArrowUp' || event.key === 'ArrowRight') setBpm((value) => Math.min(150, value + 1)); if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') setBpm((value) => Math.max(50, value - 1)); }}><span /></div>
          <div className="dial-copy"><strong>Tempo</strong><span>Drag the dial or use the slider</span></div>
          <input aria-label="Tempo" type="range" min="50" max="150" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} />
        </div>
        <div className="side-actions"><Button className="metal-button" variant="secondary" onClick={() => setBpm(selectedBeat.bpm)}><RotateCcw /> Reset</Button><Button className="metal-button" variant="secondary" onClick={() => setHelpOpen(true)}><CircleHelp /> Guide</Button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><p className="eyebrow">{collection === 'famous' ? 'FAMOUS GROOVE' : `${selectedBeat.level.toUpperCase()} COURSE`} / {selectedBeat.style.toUpperCase()}</p><h1>{selectedBeat.title}</h1><p>{selectedBeat.subtitle}</p></div><div className="header-actions"><span className={`status-light ${playing ? 'on' : ''}`}><i />{playing ? 'Playing' : 'Ready'}</span><Button className="print-button" variant="outline" disabled={pdfBusy} onClick={exportPdf}><Download /> {pdfBusy ? 'Creating PDF...' : 'Open score PDF'}</Button></div></header>
        <div className="content-grid">
          <section className="score-card">
            <div className="section-title"><div><span>Partiture</span><h2>Read and scrub the groove</h2></div><button className="key-button" onClick={() => setHelpOpen(true)}>Notation key</button></div>
            <Score beat={{ ...selectedBeat, bpm }} step={step} onScrub={(index) => { setPlaying(false); playStep(index); }} />
            <div className="transport"><Button size="icon-lg" className="play-button" aria-label={playing ? 'Pause beat' : 'Play beat'} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</Button><div className="transport-copy"><strong>{playing ? 'Keep it steady' : 'Listen, scrub, then play'}</strong><span>{playing ? `Count ${Math.floor(Math.max(step, 0) / 4) + 1}` : 'Drag the orange cursor to audition notes'}</span></div><div className="progress-track" aria-hidden="true"><span style={{ width: `${step < 0 ? 0 : ((step + 1) / 16) * 100}%` }} /></div><Volume2 size={18} /><input className="volume-range" aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></div>
          </section>
          <section className="kit-card">
            <div className="section-title"><div><span>Drum map</span><h2>See what to play</h2></div><span className="tap-note">Tap a drum</span></div>
            <div className="kit-visual"><img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Drums%20in%20the%20studio%20from%20above.jpg?width=1200" alt="Standard acoustic drum kit viewed from above" /><div className="kit-shade" /><button aria-label="Play hi-hat" className={`hotspot hh ${activeDrums.includes('hh') ? 'active' : ''}`} onClick={() => hitDrum('hh')}><span>Hi-hat</span></button><button aria-label="Play high tom" className={`hotspot tom ${activeDrums.includes('tom') ? 'active' : ''}`} onClick={() => hitDrum('tom')}><span>High tom</span></button><button aria-label="Play snare" className={`hotspot snare ${activeDrums.includes('snare') ? 'active' : ''}`} onClick={() => hitDrum('snare')}><span>Snare</span></button><button aria-label="Play kick" className={`hotspot kick ${activeDrums.includes('kick') ? 'active' : ''}`} onClick={() => hitDrum('kick')}><span>Kick</span></button></div>
            <div className="hit-readout"><Headphones size={18} /><div><span>PLAYING NOW</span><strong>{activeDrums.length ? activeDrums.map((drum) => drumLabels[drum]).join(' + ') : 'Watch the kit light up'}</strong></div></div><small className="photo-credit">Photo: Shixart1985 / Wikimedia Commons · CC BY 2.0</small>
          </section>
        </div>
      </section>
      {helpOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setHelpOpen(false)}><section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title" onMouseDown={(event) => event.stopPropagation()}><Button size="icon-sm" variant="ghost" className="modal-close" onClick={() => setHelpOpen(false)} aria-label="Close guide"><X /></Button><span className="eyebrow">QUICK GUIDE</span><h2 id="guide-title">How to read this beat</h2><p>Read from left to right. Drag anywhere across the score to hear that slice. Instruments stacked vertically are played together.</p><div className="legend-grid"><div><b>×</b><span><strong>Hi-hat</strong><small>Top line</small></span></div><div><b>●</b><span><strong>Snare</strong><small>Middle line</small></span></div><div><b>●</b><span><strong>Kick</strong><small>Bottom space</small></span></div><div><b>●</b><span><strong>Tom</strong><small>Upper space</small></span></div></div><p className="guide-tip">Tip: start slowly, scrub difficult moments, and raise the tempo only when every hit feels relaxed.</p></section></div>}
    </main>
  );
}

