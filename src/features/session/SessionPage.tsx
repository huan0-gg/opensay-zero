import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { allChunks, sceneById } from '../../content';
import { SCHEDULE } from '../../content/schedule';
import { nextAssignment } from '../../domain/plan';
import { isDue } from '../../domain/scheduler';
import { todayKey } from '../../domain/progress';
import type { Correction } from '../../domain/types';
import { createSpeech } from '../../services/speech';
import { useProgress } from '../../state/store';
import { DialoguePhase } from './DialoguePhase';
import { RecapPhase } from './RecapPhase';
import { ReviewPhase } from './ReviewPhase';
import type { SessionStats } from './session-types';
import { Icon } from '../../ui/Icon';

type Phase = 'review' | 'dialogue' | 'recap';

function parseDay(value: string | null): 1 | 2 | 3 {
  if (value === '2') return 2;
  if (value === '3') return 3;
  return 1;
}

function parseKind(value: string | null): 'scene' | 'variation' | 'final' {
  if (value === 'variation' || value === 'final') return value;
  return 'scene';
}

export function SessionPage() {
  const { sceneId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const scene = sceneId ? sceneById(sceneId) : undefined;
  const progress = useProgress((state) => state.progress);
  const setActive = useProgress((state) => state.setActive);
  const completeSession = useProgress((state) => state.completeSession);
  const recordChunkResult = useProgress((state) => state.recordChunkResult);

  const day = parseDay(params.get('day'));
  const kind = parseKind(params.get('kind'));
  const assignment = nextAssignment(progress);
  const resumable =
    progress.active && scene && progress.active.sceneId === scene.id && progress.active.day === day
      ? progress.active
      : null;

  const dueChunks = useMemo(() => {
    const now = new Date();
    return allChunks()
      .filter((chunk) => chunk.tier === 'core')
      .filter((chunk) => {
        const state = progress.chunks[chunk.id];
        return state ? isDue(state, now) : false;
      })
      .slice(0, 6);
    // The due list is decided once per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [phase, setPhase] = useState<Phase>(resumable ? 'dialogue' : dueChunks.length ? 'review' : 'dialogue');
  const sessionIdRef = useRef(resumable?.id ?? newSessionId());
  const [stats, setStats] = useState<SessionStats>({
    turns: resumable?.turns ?? 0,
    independentTurns: resumable?.independentTurns ?? 0,
    hints: resumable?.hints ?? 0,
    chunksUsed: [],
  });
  const [finalStats, setFinalStats] = useState<SessionStats | null>(null);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const startRef = useRef(Date.now() - (resumable?.minutes ?? 0) * 60000);
  const nodeRef = useRef(resumable?.nodeId ?? scene?.nodes[0]?.id ?? '');
  const variationSeed = useRef(Math.floor(Math.random() * 4)).current;

  const settings = progress.settings;
  const speech = useMemo(() => createSpeech(), []);

  const handleProgress = useCallback(
    ({ nodeId, stats: next }: { nodeId: string; stats: SessionStats }) => {
      nodeRef.current = nodeId;
      setStats(next);
      if (!scene) return;
      setActive({
        id: sessionIdRef.current,
        sceneId: scene.id,
        day,
        nodeId,
        startedAt: new Date().toISOString(),
        turns: next.turns,
        independentTurns: next.independentTurns,
        hints: next.hints,
        minutes: Math.max(0, (Date.now() - startRef.current) / 60000),
      });
    },
    [scene, setActive, day],
  );

  const handleChunkLearned = useCallback(
    (chunkId: string) => {
      const current = useProgress.getState().progress;
      if (!current.chunks[chunkId]) recordChunkResult(chunkId, 'pass');
    },
    [recordChunkResult],
  );

  if (!scene) {
    return (
      <div className="session">
        <div className="session__body empty">
          <p>没有找到这个场景。</p>
          <button type="button" className="button button--ghost" onClick={() => navigate('/home')}>
            回到今天
          </button>
        </div>
      </div>
    );
  }

  const unlocked = Boolean(progress.scenes[scene.id]) || scene.id === assignment.sceneId;
  if (!unlocked) {
    return (
      <div className="session">
        <div className="session__body empty">
          <p>这个场景还没轮到。先完成今天的练习。</p>
          <button type="button" className="button button--ghost" onClick={() => navigate('/home')}>
            回到今天
          </button>
        </div>
      </div>
    );
  }

  const finishDialogue = (nextStats: SessionStats, nextCorrections: Correction[]) => {
    setFinalStats(nextStats);
    setCorrections(nextCorrections);
    setPhase('recap');
  };

  const close = () => {
    if (phase === 'dialogue' && scene) {
      setActive({
        id: sessionIdRef.current,
        sceneId: scene.id,
        day,
        nodeId: nodeRef.current,
        startedAt: new Date().toISOString(),
        turns: stats.turns,
        independentTurns: stats.independentTurns,
        hints: stats.hints,
        minutes: Math.max(0, (Date.now() - startRef.current) / 60000),
      });
    }
    navigate('/home');
  };

  const complete = () => {
    const final = finalStats ?? stats;
    const alreadyScheduledToday = progress.sessions.some(
      (session) => session.date === todayKey() && session.completed && session.scheduled,
    );
    const scheduled =
      scene.id === assignment.sceneId &&
      day === assignment.day &&
      kind === assignment.kind &&
      !alreadyScheduledToday &&
      final.independentTurns > 0;
    completeSession({
      id: sessionIdRef.current,
      date: todayKey(),
      sceneId: scene.id,
      day,
      kind,
      planIndex: assignment.index,
      scheduled,
      turns: final.turns,
      independentTurns: final.independentTurns,
      minutes: Math.max(1, Math.round((Date.now() - startRef.current) / 60000)),
      hints: final.hints,
      corrections: selectCorrectionCount(corrections),
      completed: true,
    });
    navigate('/home');
  };

  const nextEntry = SCHEDULE[Math.min(assignment.index + 1, SCHEDULE.length - 1)];
  const nextScene = assignment.allDone ? undefined : sceneById(nextEntry.sceneId);

  return (
    <div className="session">
      <div className="session__bar">
        <div className="session__steps" aria-label="本次进度">
          <span className="session__step" data-done={phase !== 'review'} data-active={phase === 'review'} />
          <span className="session__step" data-done={phase === 'recap'} data-active={phase === 'dialogue'} />
          <span className="session__step" data-active={phase === 'recap'} />
        </div>
        <button type="button" className="session__close" aria-label="退出并保存" onClick={close}>
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className="session__body">
        {phase === 'review' ? (
          <ReviewPhase
            chunks={dueChunks}
            speech={speech}
            settings={settings}
            onDone={() => setPhase('dialogue')}
          />
        ) : null}

        {phase === 'dialogue' ? (
          <DialoguePhase
            scene={scene}
            day={day}
            speech={speech}
            settings={settings}
            startNodeId={nodeRef.current}
            initial={stats}
            initialMinutes={Math.max(0, (Date.now() - startRef.current) / 60000)}
            variation={day === 3 || kind !== 'scene'}
            variationSeed={variationSeed}
            onProgress={handleProgress}
            onFinish={finishDialogue}
            onExit={close}
            onChunkLearned={handleChunkLearned}
          />
        ) : null}

        {phase === 'recap' ? (
          <RecapPhase
            scene={scene}
            day={day}
            kind={kind}
            stats={finalStats ?? stats}
            corrections={corrections}
            nextSceneTitle={nextScene?.title}
            onComplete={complete}
          />
        ) : null}
      </div>
    </div>
  );
}

function selectCorrectionCount(corrections: Correction[]): number {
  return Math.min(3, corrections.length);
}

function newSessionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `s-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
