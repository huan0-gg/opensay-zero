import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Correction, Scene, Settings } from '../../domain/types';
import type { SpeechPort } from '../../services/speech';
import { useDialogue } from './useDialogue';
import type { SessionStats } from './session-types';
import { Icon } from '../../ui/Icon';

interface Props {
  scene: Scene;
  day: 1 | 2 | 3;
  speech: SpeechPort;
  settings: Settings;
  startNodeId?: string;
  initial?: Partial<SessionStats>;
  initialMinutes?: number;
  variation?: boolean;
  variationSeed?: number;
  onProgress: (update: { nodeId: string; stats: SessionStats }) => void;
  onFinish: (stats: SessionStats, corrections: Correction[]) => void;
  onExit: (stats: SessionStats) => void;
  onChunkLearned?: (chunkId: string) => void;
}

export function DialoguePhase({
  scene,
  day,
  speech,
  settings,
  startNodeId,
  initial,
  initialMinutes = 0,
  variation,
  variationSeed,
  onProgress,
  onFinish,
  onExit,
  onChunkLearned,
}: Props) {
  const dialogue = useDialogue({
    scene,
    speech,
    settings,
    startNodeId,
    initial,
    variation,
    variationSeed,
    onProgress,
    onFinish,
    onChunkLearned,
  });
  const [typed, setTyped] = useState('');
  const [repairOpen, setRepairOpen] = useState(false);
  const startRef = useRef(Date.now() - initialMinutes * 60000);
  const cappedRef = useRef(false);

  useEffect(() => {
    if (!repairOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRepairOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [repairOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (cappedRef.current) return;
      if (Date.now() - startRef.current >= 12 * 60 * 1000) {
        cappedRef.current = true;
        dialogue.forceFinish();
      }
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = typed.trim();
    if (!text) return;
    setTyped('');
    void dialogue.submit(text, 'text', 1);
  };

  return (
    <div className="dialogue" data-node-id={dialogue.node.id}>
      <div className="scene-chip">
        <span>第 {day} 天</span>
        <span aria-hidden="true">·</span>
        <span>{scene.title}</span>
        <span aria-hidden="true">·</span>
        <span>{dialogue.stats.turns} 轮</span>
      </div>

      <div className="npc-area">
        <div className="npc-avatar" aria-hidden="true">
          S
        </div>
        {settings.subtitles !== 'off' ? (
          <p className="npc-line" aria-live="polite">
            {dialogue.line.en}
          </p>
        ) : (
          <p className="npc-line" aria-live="polite">
            ···
          </p>
        )}
        {settings.subtitles === 'en-zh' ? <p className="npc-zh">{dialogue.line.zh}</p> : null}
        {dialogue.phase === 'thinking' ? (
          <span className="thinking" aria-label="正在回应">
            <i />
            <i />
            <i />
            正在回应
          </span>
        ) : null}
      </div>

      {dialogue.hintVisible ? (
        <div className="hints" aria-label="可以这样说">
          <p className="section-title" style={{ margin: 0 }}>
            可以这样说
          </p>
          {dialogue.node.hints.map((hint) => (
            <button
              key={hint.en}
              type="button"
              className="hint-chip"
              onClick={() => dialogue.useHint(hint)}
            >
              <span>
                <span className="hint-chip__en">{hint.en}</span>
                <span className="hint-chip__zh">{hint.zh}</span>
              </span>
              <Icon name="play" size={16} />
            </button>
          ))}
          <button type="button" className="button button--quiet" onClick={dialogue.repeatAfterHint}>
            我照读了，继续
          </button>
        </div>
      ) : null}

      <div className="mic-zone">
        {speech.available ? (
          <button
            type="button"
            className="mic"
            data-listening={dialogue.phase === 'listening'}
            aria-label="点一下说话"
            onClick={() => void dialogue.startListening()}
            disabled={dialogue.phase === 'thinking'}
          >
            <Icon name="mic" size={30} />
          </button>
        ) : null}
        <p className="mic-label">
          {speech.available
            ? dialogue.phase === 'listening'
              ? '在听，慢慢说'
              : '点一下，说一句'
            : '这个浏览器没有语音识别，直接打字也可以'}
        </p>
      </div>

      <button
        type="button"
        className="button button--quiet"
        aria-expanded={repairOpen}
        onClick={() => setRepairOpen((open) => !open)}
      >
        卡住了？说这三句救场
      </button>

      {repairOpen ? (
        <>
          <div className="sheet-backdrop" onClick={() => setRepairOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="救场句">
            <div className="sheet__handle" />
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              卡住了就说这三句
            </h2>
            <p className="today-card__sub">不用懂语法，点一下听，再跟着说。</p>
            {[
              { en: 'Sorry, could you say that again?', zh: '抱歉，能再说一遍吗？' },
              { en: 'Could you speak a little slower?', zh: '能说慢一点吗？' },
              { en: 'How do you say this in English?', zh: '这个用英语怎么说？' },
            ].map((line) => (
              <button
                key={line.en}
                type="button"
                className="hint-chip"
                onClick={() => {
                  dialogue.useHint(line);
                  setRepairOpen(false);
                }}
              >
                <span>
                  <span className="hint-chip__en">{line.en}</span>
                  <span className="hint-chip__zh">{line.zh}</span>
                </span>
                <Icon name="play" size={16} />
              </button>
            ))}
            <button type="button" className="button button--quiet" onClick={() => setRepairOpen(false)}>
              收起
            </button>
          </div>
        </>
      ) : null}

      <form className="text-answer" onSubmit={send}>
        <input
          className="input"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          aria-label="也可以打字"
          placeholder={dialogue.phase === 'thinking' ? '等它说完…' : '也可以打字，比如 How much is this?'}
          disabled={dialogue.phase === 'thinking'}
        />
        <button type="submit" className="button button--ghost" disabled={!typed.trim()}>
          发送
        </button>
      </form>

      {dialogue.transcript ? <p className="transcript">你说：{dialogue.transcript}</p> : null}
      {dialogue.notice ? <p className="notice">{dialogue.notice}</p> : null}

      <button
        type="button"
        className="button button--quiet"
        onClick={() => {
          dialogue.exit();
          onExit(dialogue.stats);
        }}
      >
        先到这里，保存进度
      </button>
    </div>
  );
}
