'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, CircleHelp, Headphones, Pause, Play, Printer, RotateCcw, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Drum = 'hh' | 'snare' | 'kick' | 'tom';
type Beat = { id: string; title: string; subtitle: string; level: 'Beginner' | 'Easy'; style: string; bpm: number; pattern: Record<Drum, number[]> };

const beats: Beat[] = [
  { id: 'first-rock', title: 'First Rock Beat', subtitle: 'Your essential 8th-note groove', level: 'Beginner', style: 'Rock', bpm: 78, pattern: {
    hh: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], kick: [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0], tom: Array(16).fill(0),
  }},
  { id: 'steady-pop', title: 'Steady Pop', subtitle: 'Even pulse with a bright backbeat', level: 'Beginner', style: 'Pop', bpm: 92, pattern: {
    hh: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], kick: [1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0], tom: Array(16).fill(0),
  }},
  { id: 'four-floor', title: 'Four on the Floor', subtitle: 'Dance-ready quarter-note kick', level: 'Easy', style: 'Dance', bpm: 108, pattern: {
    hh: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], kick: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], tom: Array(16).fill(0),
  }},
  { id: 'tom-turn', title: 'Tiny Tom Turn', subtitle: 'A one-beat fill to end the bar', level: 'Easy', style: 'Fill', bpm: 84, pattern: {
    hh: [1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], kick: [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], tom: [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  }},
];

const drumLabels: Record<Drum, string> = { hh: 'Hi-hat', snare: 'Snare', kick: 'Kick', tom: 'High tom' };
const noteY: Record<Drum, number> = { hh: 18, tom: 35, snare: 53, kick: 79 };

function Score({ beat, step }: { beat: Beat; step: number }) {
  const notes = useMemo(() => Array.from({ length: 16 }, (_, index) => (Object.keys(beat.pattern) as Drum[]).filter((drum) => beat.pattern[drum][index])), [beat]);
  return (
    <div className="score" aria-label={`Drum notation for ${beat.title}`}>
      <div className="score-meta"><span>Standard drum notation</span><span>4 / 4 · ♩ = {beat.bpm}</span></div>
      <div className="staff-wrap">
        <div className="staff-clef" aria-hidden="true">𝄥</div>
        <div className="staff" role="img" aria-label="One-bar drum score">
          {[20,35,50,65,80].map((top) => <span className="staff-line" style={{ top: `${top}%` }} key={top} />)}
          {notes.map((drums, index) => (
            <div className={`beat-column ${step === index ? 'is-current' : ''}`} style={{ left: `${(index + 0.55) * 6.05}%` }} key={index}>
              {index % 4 === 0 && <span className="beat-count">{index / 4 + 1}</span>}
              {drums.map((drum) => <span className={`note note-${drum}`} style={{ top: `${noteY[drum]}%` }} key={drum} title={drumLabels[drum]}>{drum === 'hh' ? '×' : '●'}</span>)}
              {index % 4 === 3 && index < 15 && <span className="measure-tick" />}
            </div>
          ))}
        </div>
      </div>
      <div className="count-row" aria-hidden="true">{['1','e','&','a','2','e','&','a','3','e','&','a','4','e','&','a'].map((count, index) => <span key={`${count}-${index}`}>{count}</span>)}</div>
    </div>
  );
}

export default function Home() {
  const [selectedId, setSelectedId] = useState(beats[0].id);
  const selectedBeat = beats.find((beat) => beat.id === selectedId) ?? beats[0];
  const [bpm, setBpm] = useState(selectedBeat.bpm);
  const [volume, setVolume] = useState(72);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [manualHit, setManualHit] = useState<Drum | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((drum: Drum) => {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const context = audioRef.current ?? new AudioCtx();
    audioRef.current = context;
    if (context.state === 'suspended') void context.resume();
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime((volume / 100) * 0.8, now);
    gain.connect(context.destination);
    if (drum === 'kick' || drum === 'tom') {
      const osc = context.createOscillator(); const tone = context.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(drum === 'kick' ? 125 : 190, now); osc.frequency.exponentialRampToValueAtTime(drum === 'kick' ? 46 : 92, now + 0.18);
      tone.gain.setValueAtTime(1, now); tone.gain.exponentialRampToValueAtTime(0.001, now + (drum === 'kick' ? 0.42 : 0.28));
      osc.connect(tone).connect(gain); osc.start(now); osc.stop(now + 0.45); return;
    }
    const buffer = context.createBuffer(1, context.sampleRate * 0.25, context.sampleRate); const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = context.createBufferSource(); noise.buffer = buffer;
    const filter = context.createBiquadFilter(); filter.type = drum === 'hh' ? 'highpass' : 'bandpass'; filter.frequency.value = drum === 'hh' ? 6500 : 1700;
    const envelope = context.createGain(); envelope.gain.setValueAtTime(drum === 'hh' ? 0.35 : 0.75, now); envelope.gain.exponentialRampToValueAtTime(0.001, now + (drum === 'hh' ? 0.07 : 0.2));
    noise.connect(filter).connect(envelope).connect(gain); noise.start(now); noise.stop(now + 0.22);
  }, [volume]);

  useEffect(() => {
    if (!playing) return;
    let current = step < 0 ? 0 : step;
    const tick = () => { setStep(current); (Object.keys(selectedBeat.pattern) as Drum[]).forEach((drum) => { if (selectedBeat.pattern[drum][current]) playSound(drum); }); current = (current + 1) % 16; };
    tick(); const timer = window.setInterval(tick, 60000 / bpm / 4); return () => window.clearInterval(timer);
  }, [playing, bpm, selectedBeat, playSound]);

  const activeDrums = playing && step >= 0 ? (Object.keys(selectedBeat.pattern) as Drum[]).filter((drum) => selectedBeat.pattern[drum][step]) : manualHit ? [manualHit] : [];
  const selectBeat = (beat: Beat) => { setSelectedId(beat.id); setBpm(beat.bpm); setStep(-1); setPlaying(false); };
  const hitDrum = (drum: Drum) => { playSound(drum); setManualHit(drum); window.setTimeout(() => setManualHit(null), 140); };

  return (
    <main className="app-shell">
      <aside className="groove-panel">
        <div className="brand-lockup"><span className="brand-mark">DP</span><div><strong>Drumroom</strong><small>Practice Studio</small></div></div>
        <div className="panel-heading"><p>Groove library</p><span>{beats.length} beats</span></div>
        <nav className="beat-list" aria-label="Beginner and easy drum beats">
          {beats.map((beat, index) => <button className={`beat-card ${beat.id === selectedId ? 'selected' : ''}`} key={beat.id} onClick={() => selectBeat(beat)}><span className="beat-number">0{index + 1}</span><span className="beat-copy"><strong>{beat.title}</strong><small>{beat.style} · {beat.level}</small></span><ChevronRight size={16} /></button>)}
        </nav>
        <div className="console-screen"><small>NOW PRACTICING</small><strong>{bpm}<em>BPM</em></strong><span>{selectedBeat.title.toUpperCase()}</span></div>
        <div className="dial-block">
          <div className="dial" style={{ '--dial': `${((bpm - 50) / 100) * 270 - 135}deg` } as React.CSSProperties}><span /></div>
          <div className="dial-copy"><strong>Tempo</strong><span>{bpm} beats per minute</span></div>
          <input aria-label="Tempo" type="range" min="50" max="150" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} />
        </div>
        <div className="side-actions"><Button className="metal-button" variant="secondary" onClick={() => setBpm(selectedBeat.bpm)}><RotateCcw /> Reset</Button><Button className="metal-button" variant="secondary" onClick={() => setHelpOpen(true)}><CircleHelp /> Guide</Button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><p className="eyebrow">BEAT 01 / {selectedBeat.style.toUpperCase()}</p><h1>{selectedBeat.title}</h1><p>{selectedBeat.subtitle}</p></div><div className="header-actions"><span className={`status-light ${playing ? 'on' : ''}`}><i />{playing ? 'Playing' : 'Ready'}</span><Button className="print-button" variant="outline" onClick={() => window.print()}><Printer /> Print score</Button></div></header>
        <div className="content-grid">
          <section className="score-card">
            <div className="section-title"><div><span>Partiture</span><h2>Read the groove</h2></div><button className="key-button" onClick={() => setHelpOpen(true)}>Notation key</button></div>
            <Score beat={{ ...selectedBeat, bpm }} step={step} />
            <div className="transport">
              <Button size="icon-lg" className="play-button" aria-label={playing ? 'Pause beat' : 'Play beat'} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</Button>
              <div className="transport-copy"><strong>{playing ? 'Keep it steady' : 'Listen, then play'}</strong><span>{playing ? `Count ${Math.floor(Math.max(step, 0) / 4) + 1}` : 'Press play to hear one bar loop'}</span></div>
              <div className="progress-track" aria-hidden="true"><span style={{ width: `${step < 0 ? 0 : ((step + 1) / 16) * 100}%` }} /></div><Volume2 size={18} /><input className="volume-range" aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
            </div>
          </section>
          <section className="kit-card">
            <div className="section-title"><div><span>Drum map</span><h2>See what to play</h2></div><span className="tap-note">Tap a drum</span></div>
            <div className="kit-visual"><img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Drums%20in%20the%20studio%20from%20above.jpg?width=1200" alt="Standard acoustic drum kit viewed from above" /><div className="kit-shade" />
              <button aria-label="Play hi-hat" className={`hotspot hh ${activeDrums.includes('hh') ? 'active' : ''}`} onClick={() => hitDrum('hh')}><span>Hi-hat</span></button>
              <button aria-label="Play high tom" className={`hotspot tom ${activeDrums.includes('tom') ? 'active' : ''}`} onClick={() => hitDrum('tom')}><span>High tom</span></button>
              <button aria-label="Play snare" className={`hotspot snare ${activeDrums.includes('snare') ? 'active' : ''}`} onClick={() => hitDrum('snare')}><span>Snare</span></button>
              <button aria-label="Play kick" className={`hotspot kick ${activeDrums.includes('kick') ? 'active' : ''}`} onClick={() => hitDrum('kick')}><span>Kick</span></button>
            </div>
            <div className="hit-readout"><Headphones size={18} /><div><span>PLAYING NOW</span><strong>{activeDrums.length ? activeDrums.map((drum) => drumLabels[drum]).join(' + ') : 'Watch the kit light up'}</strong></div></div>
            <small className="photo-credit">Photo: Shixart1985 / Wikimedia Commons · CC BY 2.0</small>
          </section>
        </div>
      </section>

      {helpOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setHelpOpen(false)}><section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title" onMouseDown={(event) => event.stopPropagation()}><Button size="icon-sm" variant="ghost" className="modal-close" onClick={() => setHelpOpen(false)} aria-label="Close guide"><X /></Button><span className="eyebrow">QUICK GUIDE</span><h2 id="guide-title">How to read this beat</h2><p>Read from left to right. The orange column is the note you hear now. Instruments stacked vertically are played together.</p><div className="legend-grid"><div><b>×</b><span><strong>Hi-hat</strong><small>Top line</small></span></div><div><b>●</b><span><strong>Snare</strong><small>Middle line</small></span></div><div><b>●</b><span><strong>Kick</strong><small>Bottom space</small></span></div><div><b>●</b><span><strong>Tom</strong><small>Upper space</small></span></div></div><p className="guide-tip">Tip: start at 60–70 BPM, loop the bar, and raise the tempo only when every hit feels relaxed.</p></section></div>}
    </main>
  );
}

