'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, CircleHelp, Download, Headphones, Pause, Play, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { allBeats, completeSongs, courseBeats, famousBeats, type Beat, type Drum, type Level, type Pattern } from './beats';
import './enhancements.css';

const drumLabels: Record<Drum, string> = { hh: 'Closed hi-hat', oh: 'Open hi-hat', snare: 'Snare', kick: 'Kick', tom: 'High tom' };
const noteY: Record<Drum, number> = { hh: 18, oh: 18, tom: 35, snare: 53, kick: 79 };
const levels: Level[] = ['Beginner', 'Intermediate', 'Advanced'];
type Library = 'course' | 'famous' | 'songs';
type TimelineBar = { section: string; sectionIndex: number; sectionBars: number; barInSection: number; pattern: Pattern };

const timelineFor = (beat: Beat): TimelineBar[] => beat.sections?.flatMap((section, sectionIndex) =>
  Array.from({ length: section.bars }, (_, barIndex) => ({
    section: section.name,
    sectionIndex,
    sectionBars: section.bars,
    barInSection: barIndex + 1,
    pattern: section.pattern,
  })),
) ?? [{ section: 'Groove', sectionIndex: 0, sectionBars: 1, barInSection: 1, pattern: beat.pattern }];

type LoopRange = { start: number; end: number };

function Score({
  beat,
  step,
  muted,
  loopRange,
  onScrub,
  onToggleMute,
  onLoopChange,
}: {
  beat: Beat;
  step: number;
  muted: Record<Drum, boolean>;
  loopRange: LoopRange | null;
  onScrub: (step: number) => void;
  onToggleMute: (drum: Drum) => void;
  onLoopChange: (range: LoopRange | null) => void;
}) {
  const notes = useMemo(() => Array.from({ length: 16 }, (_, index) => (Object.keys(beat.pattern) as Drum[]).filter((drum) => beat.pattern[drum][index])), [beat]);
  const scoreRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<number | null>(null);
  const dragMovedRef = useRef(false);

  const indexFromPointer = (clientX: number) => {
    const rect = staffRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(15, Math.floor(((clientX - rect.left) / rect.width) * 16)));
  };

  useEffect(() => {
    const clearOutside = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-loop-safe="true"]')) return;
      if (loopRange && scoreRef.current && !scoreRef.current.contains(target)) onLoopChange(null);
    };
    document.addEventListener('pointerdown', clearOutside);
    return () => document.removeEventListener('pointerdown', clearOutside);
  }, [loopRange, onLoopChange]);

  const beginSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    const index = indexFromPointer(event.clientX);
    dragStartRef.current = index;
    dragMovedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    onLoopChange({ start: index, end: index });
  };

  const moveSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const index = indexFromPointer(event.clientX);
    dragMovedRef.current = dragMovedRef.current || index !== dragStartRef.current;
    onLoopChange({ start: Math.min(dragStartRef.current, index), end: Math.max(dragStartRef.current, index) });
  };

  const finishSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartRef.current === null) return;
    const index = indexFromPointer(event.clientX);
    if (!dragMovedRef.current) {
      onLoopChange(null);
      onScrub(index);
    }
    dragStartRef.current = null;
    dragMovedRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="score" ref={scoreRef} aria-label={'Drum notation for ' + beat.title}>
      <div className="score-meta"><span>Standard drum notation</span><span>4 / 4 · ♩ = {beat.bpm}</span></div>
      <div className="track-mutes" aria-label="Mute individual drum tracks">
        {(Object.keys(drumLabels) as Drum[]).map((drum) => (
          <button className={'track-mute ' + (muted[drum] ? 'muted' : '')} key={drum} onClick={() => onToggleMute(drum)} aria-pressed={muted[drum]} title={(muted[drum] ? 'Unmute ' : 'Mute ') + drumLabels[drum]}>
            {muted[drum] ? <VolumeX size={13} /> : <Volume2 size={13} />}<span>{drumLabels[drum]}</span>
          </button>
        ))}
      </div>
      <div className="staff-wrap">
        <div className="staff-clef" aria-hidden="true">𝄥</div>
        <div
          className="staff"
          ref={staffRef}
          role="slider"
          tabIndex={0}
          aria-label="Drag to select a loop, or click to audition a slice"
          aria-valuemin={1}
          aria-valuemax={16}
          aria-valuenow={Math.max(step + 1, 1)}
          onPointerDown={beginSelection}
          onPointerMove={moveSelection}
          onPointerUp={finishSelection}
          onPointerCancel={finishSelection}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') onScrub(Math.min(15, Math.max(step, 0) + 1));
            if (event.key === 'ArrowLeft') onScrub(Math.max(0, Math.max(step, 0) - 1));
            if (event.key === 'Escape') onLoopChange(null);
          }}
        >
          {[20,35,50,65,80].map((top) => <span className="staff-line" style={{ top: top + '%' }} key={top} />)}
          {loopRange && <div className="loop-selection" style={{ left: (loopRange.start / 16) * 100 + '%', width: ((loopRange.end - loopRange.start + 1) / 16) * 100 + '%' }}><span>LOOP</span><button aria-label="Clear loop selection" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onLoopChange(null); }}><X size={12} /></button></div>}
          {notes.map((drums, index) => (
            <div className={'beat-column ' + (step === index ? 'is-current ' : '') + (loopRange && index >= loopRange.start && index <= loopRange.end ? 'in-loop' : '')} style={{ left: (index + 0.55) * 6.05 + '%' }} key={index}>
              {index % 4 === 0 && <span className="beat-count">{index / 4 + 1}</span>}
              {drums.map((drum) => <span className={'note note-' + drum + (muted[drum] ? ' note-muted' : '')} style={{ top: noteY[drum] + '%' }} key={drum} title={drumLabels[drum]}>{drum === 'hh' ? '×' : drum === 'oh' ? '○' : '●'}</span>)}
              {index % 4 === 3 && index < 15 && <span className="measure-tick" />}
            </div>
          ))}
        </div>
      </div>
      <div className="count-row" aria-hidden="true">{['1','e','&','a','2','e','&','a','3','e','&','a','4','e','&','a'].map((count, index) => <span key={count + '-' + index}>{count}</span>)}</div>
      <p className="scrub-hint">{loopRange ? 'Looping slices ' + (loopRange.start + 1) + '-' + (loopRange.end + 1) + ' · click × or outside the score to clear' : 'Click to audition · drag across the score to select a loop'}</p>
    </div>
  );
}

export default function Home() {
  const [collection, setCollection] = useState<Library>('course');
  const [level, setLevel] = useState<Level>('Beginner');
  const [selectedId, setSelectedId] = useState(courseBeats[0].id);
  const selectedBeat = allBeats.find((beat) => beat.id === selectedId) ?? courseBeats[0];
  const timeline = useMemo(() => timelineFor(selectedBeat), [selectedBeat]);
  const [bpm, setBpm] = useState(selectedBeat.bpm);
  const [volume, setVolume] = useState(72);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(-1);
  const [helpOpen, setHelpOpen] = useState(false);
  const [manualHit, setManualHit] = useState<Drum | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [muted, setMuted] = useState<Record<Drum, boolean>>({ hh: false, oh: false, snare: false, kick: false, tom: false });
  const [loopRange, setLoopRange] = useState<LoopRange | null>(null);
  const currentBarIndex = Math.min(Math.floor(Math.max(step, 0) / 16), timeline.length - 1);
  const currentBar = timeline[currentBarIndex];
  const currentPattern = currentBar.pattern;
  const localStep = step < 0 ? -1 : step % 16;
  const localLoopRange = loopRange && Math.floor(loopRange.start / 16) === currentBarIndex && Math.floor(loopRange.end / 16) === currentBarIndex ? { start: loopRange.start % 16, end: loopRange.end % 16 } : null;
  const sectionStarts = useMemo(() => { let start = 0; return selectedBeat.sections?.map((section) => { const item = { ...section, start }; start += section.bars; return item; }) ?? []; }, [selectedBeat]);
  const audioRef = useRef<AudioContext | null>(null);

  const visibleBeats = useMemo(() => (collection === 'course' ? courseBeats : collection === 'famous' ? famousBeats : completeSongs).filter((beat) => beat.level === level), [collection, level]);
  const levelOptions = levels;

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
    filter.type = drum === 'hh' || drum === 'oh' ? 'highpass' : 'bandpass'; filter.frequency.value = drum === 'oh' ? 5600 : drum === 'hh' ? 6500 : 1700;
    const envelope = context.createGain(); envelope.gain.setValueAtTime(drum === 'hh' ? 0.35 : drum === 'oh' ? 0.42 : 0.75, now); envelope.gain.exponentialRampToValueAtTime(0.001, now + (drum === 'hh' ? 0.07 : drum === 'oh' ? 0.34 : 0.2));
    noise.connect(filter).connect(envelope).connect(gain); noise.start(now); noise.stop(now + 0.22);
  }, [volume]);

  const playStep = useCallback((index: number) => {
    const bar = timeline[Math.floor(index / 16)] ?? timeline[0];
    const slice = index % 16;
    setStep(index);
    (Object.keys(bar.pattern) as Drum[]).forEach((drum) => { if (bar.pattern[drum][slice] && !muted[drum]) playSound(drum); });
  }, [timeline, playSound, muted]);

  useEffect(() => {
    if (!playing) return;
    const start = loopRange?.start ?? 0;
    const end = loopRange?.end ?? timeline.length * 16 - 1;
    let current = step >= start && step <= end ? step : start;
    const tick = () => { playStep(current); current = current >= end ? start : current + 1; };
    tick(); const timer = window.setInterval(tick, 60000 / bpm / 4); return () => window.clearInterval(timer);
  }, [playing, bpm, selectedBeat.id, playStep, loopRange, timeline.length]);

  const chooseCollection = (next: Library) => {
    const nextLevel: Level = 'Beginner'; const first = next === 'course' ? courseBeats[0] : next === 'famous' ? famousBeats[0] : completeSongs[0];
    setCollection(next); setLevel(nextLevel); setSelectedId(first.id); setBpm(first.bpm); setStep(-1); setLoopRange(null); setPlaying(false);
  };
  const chooseLevel = (next: Level) => {
    const first = (collection === 'course' ? courseBeats : collection === 'famous' ? famousBeats : completeSongs).find((beat) => beat.level === next);
    setLevel(next); if (first) { setSelectedId(first.id); setBpm(first.bpm); } setStep(-1); setLoopRange(null); setPlaying(false);
  };
  const selectBeat = (beat: Beat) => { setSelectedId(beat.id); setBpm(beat.bpm); setStep(-1); setLoopRange(null); setPlaying(false); };
  const toggleMute = (drum: Drum) => setMuted((current) => ({ ...current, [drum]: !current[drum] }));
  const hitDrum = (drum: Drum) => { playSound(drum); setManualHit(drum); window.setTimeout(() => setManualHit(null), 140); };
  const activeDrums = playing && step >= 0 ? (Object.keys(currentPattern) as Drum[]).filter((drum) => currentPattern[drum][localStep] && !muted[drum]) : manualHit ? [manualHit] : [];

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
      const pdfY: Record<Drum, number> = { hh: staffY - 4, oh: staffY - 4, tom: staffY + gap, snare: staffY + gap * 2, kick: staffY + gap * 4.5 };
      for (let index = 0; index < 16; index += 1) {
        const x = staffX + 9 + index * (staffW - 18) / 15;
        if (index % 4 === 0) { doc.setFontSize(7); doc.setTextColor(125, 125, 125); doc.text(String(index / 4 + 1), x - 1, staffY - 13); doc.setTextColor(35, 36, 38); }
        if (index > 0 && index % 4 === 0) { doc.setLineWidth(0.6); doc.line(x - 7, staffY, x - 7, staffY + gap * 4); }
        (Object.keys(currentPattern) as Drum[]).forEach((drum) => {
          if (!currentPattern[drum][index]) return;
          const y = pdfY[drum]; doc.setDrawColor(25, 25, 25); doc.setFillColor(25, 25, 25); doc.setLineWidth(0.45);
          if (drum === 'hh' || drum === 'oh') { doc.line(x - 1.7, y - 1.7, x + 1.7, y + 1.7); doc.line(x + 1.7, y - 1.7, x - 1.7, y + 1.7); }
          else doc.ellipse(x, y, 2.2, 1.45, 'F');
          doc.line(x + 2, y, x + 2, y - 11);
        });
      }
      doc.setDrawColor(200, 200, 198); doc.line(16, 134, 281, 134);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.text('NOTATION KEY', 16, 145); doc.setFont('helvetica', 'normal'); doc.setTextColor(85, 85, 85);
      doc.text('x  Hi-hat', 16, 154); doc.text('-  High tom', 62, 154); doc.text('-  Snare', 116, 154); doc.text('-  Kick', 160, 154);
      doc.setTextColor(241, 83, 29); doc.setFont('helvetica', 'bold'); doc.text('DRUM ROOM', 16, 190); doc.setTextColor(110, 110, 110); doc.setFont('helvetica', 'normal'); doc.text('Practice slowly. Keep your strokes relaxed. Raise the tempo only when the groove feels steady.', 42, 190);
      if (selectedBeat.sections) {
        doc.addPage('a4', 'landscape');
        doc.setFillColor(45, 54, 73); doc.rect(0, 0, 297, 24, 'F');
        doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(selectedBeat.title + ' - COMPLETE ARRANGEMENT', 15, 15);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(timeline.length + ' BARS / ' + selectedBeat.sections.length + ' SECTIONS / ' + bpm + ' BPM', 282, 15, { align: 'right' });
        let rowY = 34;
        selectedBeat.sections.forEach((section, sectionIndex) => {
          doc.setTextColor(241, 83, 29); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(String(sectionIndex + 1).padStart(2, '0') + '  ' + section.name.toUpperCase(), 15, rowY + 4);
          doc.setTextColor(95, 95, 95); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text(section.bars + ' bars', 15, rowY + 10);
          const miniX = 62, miniW = 215, miniGap = 3;
          doc.setDrawColor(65, 65, 65); doc.setLineWidth(0.22);
          for (let line = 0; line < 5; line += 1) doc.line(miniX, rowY + line * miniGap, miniX + miniW, rowY + line * miniGap);
          const miniY: Record<Drum, number> = { hh: rowY - 2, oh: rowY - 2, tom: rowY + miniGap, snare: rowY + miniGap * 2, kick: rowY + miniGap * 4.5 };
          for (let index = 0; index < 16; index += 1) {
            const x = miniX + 7 + index * (miniW - 14) / 15;
            (Object.keys(section.pattern) as Drum[]).forEach((drum) => {
              if (!section.pattern[drum][index]) return;
              const y = miniY[drum]; doc.setDrawColor(25, 25, 25); doc.setFillColor(25, 25, 25); doc.setLineWidth(0.3);
              if (drum === 'hh') { doc.line(x - 1.1, y - 1.1, x + 1.1, y + 1.1); doc.line(x + 1.1, y - 1.1, x - 1.1, y + 1.1); }
              else if (drum === 'oh') doc.circle(x, y, 1.2, 'S');
              else doc.ellipse(x, y, 1.5, 0.9, 'F');
              doc.line(x + 1.3, y, x + 1.3, y - 6);
            });
          }
          if (section.note) { doc.setTextColor(105, 105, 105); doc.setFontSize(6.5); doc.text(section.note, miniX, rowY + 17); }
          rowY += 27;
        });
        doc.setDrawColor(205, 205, 202); doc.line(15, 198, 282, 198);
        doc.setTextColor(241, 83, 29); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.text('PLAYING GUIDE', 15, 205);
        doc.setTextColor(90, 90, 90); doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.text(doc.splitTextToSize(selectedBeat.technique, 225), 47, 204);
      }
      const url = URL.createObjectURL(doc.output('blob')); pdfTab.location.href = url; window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { pdfTab.close(); window.alert('The PDF could not be created. Please try again.'); }
    finally { setPdfBusy(false); }
  };

  return (
    <main className="app-shell">
      <aside className="groove-panel">
        <div className="brand-lockup"><span className="brand-mark">DR</span><div><strong>Drum Room</strong><small>Practice Studio</small></div></div>
        <div className="library-switch"><button className={collection === 'course' ? 'active' : ''} onClick={() => chooseCollection('course')}>Practice course</button><button className={collection === 'famous' ? 'active' : ''} onClick={() => chooseCollection('famous')}>Famous grooves</button><button className={collection === 'songs' ? 'active' : ''} onClick={() => chooseCollection('songs')}>Complete songs</button></div>
        <div className="level-tabs">{levelOptions.map((option) => <button className={level === option ? 'active' : ''} key={option} onClick={() => chooseLevel(option)}>{option}</button>)}</div>
        <div className="panel-heading"><p>{collection === 'course' ? level + ' beats' : collection === 'famous' ? level + ' classics' : level + ' songs'}</p><span>{visibleBeats.length} tracks</span></div>
        <nav className="beat-list" aria-label="Drum beat library">{visibleBeats.map((beat, index) => <button className={'beat-card ' + (beat.id === selectedId ? 'selected' : '')} key={beat.id} onClick={() => selectBeat(beat)}><span className="beat-number">{String(index + 1).padStart(2, '0')}</span><span className="beat-copy"><strong>{beat.title}</strong>{beat.artist && <em>{beat.artist}</em>}<small>{beat.style} · {beat.level}</small></span><ChevronRight size={16} /></button>)}</nav>
        <div className="console-screen"><small>NOW PRACTICING</small><strong>{bpm}<em>BPM</em></strong><span>{selectedBeat.title.toUpperCase()}</span></div>
        <div className="dial-block">
          <div className="dial interactive" role="slider" aria-label="Tempo dial" aria-valuemin={50} aria-valuemax={150} aria-valuenow={bpm} tabIndex={0} style={{ '--dial': `${((bpm - 50) / 100) * 270 - 135}deg` } as React.CSSProperties} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); updateDial(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateDial(event); }} onKeyDown={(event) => { if (event.key === 'ArrowUp' || event.key === 'ArrowRight') setBpm((value) => Math.min(150, value + 1)); if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') setBpm((value) => Math.max(50, value - 1)); }}><span /></div>
          <div className="dial-copy"><strong>Tempo</strong><span>Drag the dial or use the slider</span></div>
          <input aria-label="Tempo" type="range" min="50" max="150" value={bpm} onChange={(event) => setBpm(Number(event.target.value))} />
        </div>
        <div className="side-actions"><Button className="metal-button" variant="secondary" onClick={() => setBpm(selectedBeat.bpm)}><RotateCcw /> Reset</Button><Button className="metal-button" variant="secondary" onClick={() => setHelpOpen(true)}><CircleHelp /> Guide</Button></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><p className="eyebrow">{collection === 'famous' ? 'FAMOUS GROOVE' : collection === 'songs' ? 'COMPLETE SONG' : selectedBeat.level.toUpperCase() + ' COURSE'} / {selectedBeat.style.toUpperCase()}</p><h1>{selectedBeat.title}</h1>{selectedBeat.artist && <span className="artist-line">by {selectedBeat.artist}</span>}<p>{selectedBeat.subtitle}</p></div><div className="header-actions"><span className={'status-light ' + (playing ? 'on' : '')}><i />{playing ? 'Playing' : 'Ready'}</span><Button className="print-button" variant="outline" disabled={pdfBusy} onClick={exportPdf}><Download /> {pdfBusy ? 'Creating PDF...' : 'Open score PDF'}</Button></div></header>
        <div className="content-grid">
          <section className="score-card">
            <div className="section-title"><div><span>Partiture</span><h2>Read, isolate, and loop the groove</h2></div><button className="key-button" onClick={() => setHelpOpen(true)}>Notation key</button></div>
            {selectedBeat.sections && <div className="song-arrangement"><div className="arrangement-heading"><span>SONG MAP</span><strong>{timeline.length} bars · {sectionStarts.length} sections</strong></div><div className="section-strip">{sectionStarts.map((section, index) => <button key={section.name} className={currentBar.sectionIndex === index ? 'active' : ''} onClick={() => { setPlaying(false); setLoopRange(null); setStep(section.start * 16); }}><b>{section.name}</b><small>{section.bars} bars</small></button>)}</div><div className="bar-navigator"><button disabled={currentBarIndex === 0} onClick={() => { setPlaying(false); setLoopRange(null); setStep(Math.max(0, currentBarIndex - 1) * 16); }}>Previous bar</button><span>{currentBar.section} · bar {currentBar.barInSection} of {currentBar.sectionBars} · song bar {currentBarIndex + 1} of {timeline.length}</span><button disabled={currentBarIndex === timeline.length - 1} onClick={() => { setPlaying(false); setLoopRange(null); setStep(Math.min(timeline.length - 1, currentBarIndex + 1) * 16); }}>Next bar</button></div></div>}
            <Score beat={{ ...selectedBeat, bpm, pattern: currentPattern }} step={localStep} muted={muted} loopRange={localLoopRange} onToggleMute={toggleMute} onLoopChange={(range) => setLoopRange(range ? { start: currentBarIndex * 16 + range.start, end: currentBarIndex * 16 + range.end } : null)} onScrub={(index) => { setPlaying(false); playStep(currentBarIndex * 16 + index); }} />
            <div className="beat-guide"><div><span>ABOUT THIS BEAT</span><p>{selectedBeat.subtitle}</p></div><div><span>HOW TO PLAY IT</span><p>{selectedBeat.technique}</p></div></div>
            <div className="transport"><Button size="icon-lg" className="play-button" data-loop-safe="true" aria-label={playing ? 'Pause beat' : 'Play beat'} onClick={() => setPlaying((value) => !value)}>{playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</Button><div className="transport-copy"><strong>{playing ? 'Keep it steady' : selectedBeat.sections ? 'Play the complete arrangement' : 'Listen, scrub, then play'}</strong><span>{selectedBeat.sections ? currentBar.section + ' · bar ' + currentBar.barInSection + ' of ' + currentBar.sectionBars : playing ? 'Count ' + (Math.floor(Math.max(localStep, 0) / 4) + 1) : 'Drag the orange cursor to audition notes'}</span></div><div className="progress-track" aria-hidden="true"><span style={{ width: (step < 0 ? 0 : ((step + 1) / (timeline.length * 16)) * 100) + '%' }} /></div><Volume2 size={18} /><input className="volume-range" aria-label="Volume" type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} /></div>
          </section>
          <section className="kit-card">
            <div className="section-title"><div><span>Drum map</span><h2>See what to play</h2></div><span className="tap-note">Tap a drum</span></div>
            <div className="kit-visual"><img src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Drums%20in%20the%20studio%20from%20above.jpg?width=1200" alt="Standard acoustic drum kit viewed from above" /><div className="kit-shade" /><button aria-label="Play hi-hat" className={`hotspot hh ${(activeDrums.includes('hh') || activeDrums.includes('oh')) ? 'active' : ''}`} onClick={() => hitDrum('hh')}><span>Hi-hat</span></button><button aria-label="Play high tom" className={`hotspot tom ${activeDrums.includes('tom') ? 'active' : ''}`} onClick={() => hitDrum('tom')}><span>High tom</span></button><button aria-label="Play snare" className={`hotspot snare ${activeDrums.includes('snare') ? 'active' : ''}`} onClick={() => hitDrum('snare')}><span>Snare</span></button><button aria-label="Play kick" className={`hotspot kick ${activeDrums.includes('kick') ? 'active' : ''}`} onClick={() => hitDrum('kick')}><span>Kick</span></button></div>
            <div className="hit-readout"><Headphones size={18} /><div><span>PLAYING NOW</span><strong>{activeDrums.length ? activeDrums.map((drum) => drumLabels[drum]).join(' + ') : 'Watch the kit light up'}</strong></div></div><small className="photo-credit">Photo: Shixart1985 / Wikimedia Commons · CC BY 2.0</small>
          </section>
        </div>
      </section>
      {helpOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setHelpOpen(false)}><section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title" onMouseDown={(event) => event.stopPropagation()}><Button size="icon-sm" variant="ghost" className="modal-close" onClick={() => setHelpOpen(false)} aria-label="Close guide"><X /></Button><span className="eyebrow">QUICK GUIDE</span><h2 id="guide-title">How to read this beat</h2><p>Read left to right. Click a slice to hear it, or drag across several slices to create a repeating loop. Use the speaker controls to mute individual instruments.</p><div className="legend-grid"><div><b>× / ○</b><span><strong>Closed / open hi-hat</strong><small>Top line</small></span></div><div><b>●</b><span><strong>Snare</strong><small>Middle line</small></span></div><div><b>●</b><span><strong>Kick</strong><small>Bottom space</small></span></div><div><b>●</b><span><strong>Tom</strong><small>Upper space</small></span></div></div><p className="guide-tip">Tip: mute one track at a time, loop a difficult phrase, and add each limb back only when the groove feels relaxed.</p></section></div>}
    </main>
  );
}

