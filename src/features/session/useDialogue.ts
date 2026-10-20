import { useEffect, useMemo, useRef, useState } from 'react';
import type { Correction, NpcLine, Scene, Settings, SpeechSource } from '../../domain/types';
import type { SpeechPort } from '../../services/speech';
import { matchIntent, normalize } from '../../domain/intent-matcher';
import { isIndependentTurn } from '../../domain/turn-filter';
import { wordCount } from '../../domain/turn-filter';
import { isSensitiveTopic } from '../../domain/safety';
import { createVariation } from '../../domain/variation';
import type { SessionStats } from './session-types';

interface Options {
  scene: Scene;
  speech: SpeechPort;
  settings: Settings;
  startNodeId?: string;
  variation?: boolean;
  variationSeed?: number;
  initial?: Partial<SessionStats>;
  onProgress: (update: { nodeId: string; stats: SessionStats }) => void;
  onFinish: (stats: SessionStats, corrections: Correction[]) => void;
  onChunkLearned?: (chunkId: string) => void;
}

function chunkSimilarity(text: string, target: string): number {
  const said = new Set(normalize(text).split(' ').filter(Boolean));
  const want = new Set(normalize(target).split(' ').filter(Boolean));
  if (said.size === 0 || want.size === 0) return 0;
  let hit = 0;
  for (const word of want) if (said.has(word)) hit += 1;
  return hit / want.size;
}

export function useDialogue({
  scene,
  speech,
  settings,
  startNodeId,
  variation: variationEnabled = false,
  variationSeed = 0,
  initial,
  onProgress,
  onFinish,
  onChunkLearned,
}: Options) {
  const firstNode = scene.nodes.find((node) => node.id === startNodeId) ?? scene.nodes[0];
  const variation = useMemo(
    () => createVariation(variationEnabled, variationSeed),
    [variationEnabled, variationSeed],
  );
  const v = (value: NpcLine): NpcLine => ({ en: variation.apply(value.en), zh: value.zh });
  const [nodeId, setNodeId] = useState(firstNode.id);
  const [line, setLine] = useState<NpcLine>(firstNode.npc[0]);
  const [phase, setPhase] = useState<'npc' | 'listening' | 'thinking'>('npc');
  const [hintVisible, setHintVisible] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({
    turns: initial?.turns ?? 0,
    independentTurns: initial?.independentTurns ?? 0,
    hints: initial?.hints ?? 0,
    chunksUsed: initial?.chunksUsed ?? [],
  });

  const statsRef = useRef(stats);
  const correctionsRef = useRef<Correction[]>([]);
  const missRef = useRef(0);
  const usedHintRef = useRef(false);
  const lastUserRef = useRef('');
  const timerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const startedRef = useRef(false);
  const learnedRef = useRef<Set<string>>(new Set());
  const blockedRef = useRef(0);
  const tokenRef = useRef(0);
  const nodeRef = useRef(firstNode);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const node = scene.nodes.find((candidate) => candidate.id === nodeId) ?? firstNode;
  nodeRef.current = node;

  const commit = (next: SessionStats) => {
    statsRef.current = next;
    setStats(next);
  };

  const speakLine = async (value: NpcLine) => {
    if (!settings.sound) return;
    try {
      await speech.speak(variation.apply(value.en), { rate: settings.rate });
    } catch {
      // Subtitles still carry the line.
    }
  };

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const scheduleHint = () => {
    clearTimer();
    setHintVisible(false);
    timerRef.current = window.setTimeout(() => setHintVisible(true), 3000);
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(statsRef.current, correctionsRef.current);
  };

  const beginNode = (id: string) => {
    const nextNode = scene.nodes.find((candidate) => candidate.id === id);
    if (!nextNode) return;
    const npc = v(nextNode.npc[Math.floor(Math.random() * nextNode.npc.length)]);
    const token = ++tokenRef.current;
    setNodeId(id);
    setLine(npc);
    setPhase('npc');
    setTranscript('');
    setNotice(null);
    missRef.current = 0;
    usedHintRef.current = false;
    void (async () => {
      await speakLine(npc);
      if (token !== tokenRef.current) return;
      setPhase('listening');
      scheduleHint();
    })();
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    beginNode(firstNode.id);
    return () => {
      clearTimer();
      speech.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onProgress({ nodeId, stats });
  }, [nodeId, stats, onProgress]);

  const finishWith = (reply: NpcLine, intentId: string) => {
    const token = ++tokenRef.current;
    void (async () => {
      await speakLine(reply);
      if (finishedRef.current || token !== tokenRef.current) return;
      const current = nodeRef.current;
      const intent = current.intents.find((candidate) => candidate.id === intentId);
      if (intent?.end) {
        finish();
        return;
      }
      if (intent?.next) {
        beginNode(intent.next);
        return;
      }
      setPhase('listening');
      scheduleHint();
    })();
  };

  const submit = async (text: string, source: SpeechSource = 'text', confidence = 1) => {
    if (phaseRef.current === 'thinking' || finishedRef.current) return;
    tokenRef.current += 1;
    speech.cancel();
    clearTimer();
    setHintVisible(false);
    setPhase('thinking');
    setTranscript(text);

    if (isSensitiveTopic(text)) {
      blockedRef.current += 1;
      const reply: NpcLine = v({
        en: "I'd suggest asking a professional about that. Shall we get back to the order?",
        zh: '这个我建议你咨询专业人士。我们继续点单，好吗？',
      });
      setLine(reply);
      setNotice('这个问题我不展开。我们先把这个场景练完。');
      commit({ ...statsRef.current, turns: statsRef.current.turns + 1 });
      const token = ++tokenRef.current;
      await speakLine(reply);
      if (token !== tokenRef.current || finishedRef.current) return;
      if (blockedRef.current >= 2) {
        finish();
        return;
      }
      setPhase('listening');
      scheduleHint();
      return;
    }

    const match = matchIntent(text, nodeRef.current);
    const usedHint = usedHintRef.current;
    usedHintRef.current = false;
    const repeat = lastUserRef.current !== '' && normalize(lastUserRef.current) === normalize(text);
    lastUserRef.current = text;

    if (!match.intentId) {
      missRef.current += 1;
      const reply: NpcLine = v(
        missRef.current >= 2
          ? {
              en: "Let's get back to it. Where would you like to start?",
              zh: '我们回到正题。你想从哪句开始？',
            }
          : nodeRef.current.repair,
      );
      if (missRef.current >= 2) missRef.current = 0;
      setNotice('没听清也没关系，可以再说一次，或者点下面的句子。');
      setLine(reply);
      commit({
        ...statsRef.current,
        turns: statsRef.current.turns + 1,
      });
      setPhase('thinking');
      const token = ++tokenRef.current;
      await speakLine(reply);
      if (token !== tokenRef.current) return;
      setPhase('listening');
      scheduleHint();
      return;
    }

    const intent = nodeRef.current.intents.find((candidate) => candidate.id === match.intentId);
    if (!intent) return;

    const independent = isIndependentTurn({
      text,
      confidence,
      source,
      usedHint,
      isRepeat: repeat,
      intentId: intent.id,
    });

    if (!usedHint && intent.chunkId && chunkSimilarity(text, scene.chunks.find((chunk) => chunk.id === intent.chunkId)?.en ?? '') < 0.6) {
      const chunk = scene.chunks.find((candidate) => candidate.id === intent.chunkId);
      if (chunk) {
        correctionsRef.current = [
          ...correctionsRef.current,
          {
            kind: 'chunk',
            impact: chunk.tier === 'core' ? 3 : 1,
            said: text,
            better: chunk.en,
            why: chunk.why ?? '这样说更完整，对方更容易听懂。',
          },
        ];
      }
    }

    const chunksUsed =
      independent && intent.chunkId && !statsRef.current.chunksUsed.includes(intent.chunkId)
        ? [...statsRef.current.chunksUsed, intent.chunkId]
        : statsRef.current.chunksUsed;

    if (independent && intent.chunkId && !learnedRef.current.has(intent.chunkId)) {
      learnedRef.current.add(intent.chunkId);
      onChunkLearned?.(intent.chunkId);
    }

    commit({
      turns: statsRef.current.turns + 1,
      independentTurns: statsRef.current.independentTurns + (independent ? 1 : 0),
      hints: statsRef.current.hints,
      chunksUsed,
    });
    setNotice(null);

    const reply = v(intent.reply);
    setLine(reply);
    setPhase('thinking');
    finishWith(reply, intent.id);
  };

  const startListening = async () => {
    tokenRef.current += 1;
    if (phaseRef.current === 'npc' || phaseRef.current === 'thinking') {
      speech.cancel();
    }
    setPhase('listening');
    setNotice(null);
    try {
      const result = await speech.listen({ timeoutMs: 12000 });
      await submit(result.text, result.source, result.confidence);
    } catch {
      setNotice('没听清。可以再说一次，或者直接打字。');
      setPhase('listening');
      scheduleHint();
    }
  };

  const useHint = (hint: NpcLine) => {
    usedHintRef.current = true;
    commit({ ...statsRef.current, hints: statsRef.current.hints + 1 });
    const spoken = v(hint);
    void speakLine(spoken);
    setTranscript(spoken.en);
    setNotice('跟着说一遍就好。点麦克风，或者说「我照读了」。');
  };

  const repeatAfterHint = () => {
    const current = nodeRef.current;
    const intent =
      current.intents.find((candidate) => candidate.end) ??
      current.intents.find((candidate) => candidate.next) ??
      current.intents[0];
    if (!intent) return;
    clearTimer();
    setHintVisible(false);
    commit({
      ...statsRef.current,
      turns: statsRef.current.turns + 1,
      hints: statsRef.current.hints + 1,
    });
    const reply = v(intent.reply);
    setTranscript(reply.en);
    setPhase('thinking');
    finishWith(reply, intent.id);
  };

  const exit = () => {
    clearTimer();
    speech.cancel();
    onProgress({ nodeId, stats: statsRef.current });
  };

  const forceFinish = () => {
    clearTimer();
    speech.cancel();
    finish();
  };

  return {
    node,
    line,
    phase,
    hintVisible,
    transcript,
    notice,
    stats,
    startListening,
    submit,
    useHint,
    repeatAfterHint,
    exit,
    forceFinish,
    wordCount,
  };
}
