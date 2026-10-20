import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AsrResult } from '../../domain/types';
import { createSpeech } from '../../services/speech';
import { useProgress } from '../../state/store';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

type Question =
  | { kind: 'listen'; audio: string; prompt: string; options: string[]; correct: number }
  | { kind: 'repeat'; en: string; zh: string }
  | { kind: 'open'; en: string; zh: string };

const QUESTIONS: Question[] = [
  {
    kind: 'listen',
    audio: 'How much is it?',
    prompt: '这句话是什么意思？',
    options: ['多少钱？', '你要什么？', '洗手间在哪里？'],
    correct: 0,
  },
  {
    kind: 'listen',
    audio: 'To go, please.',
    prompt: '这句话是什么意思？',
    options: ['在这儿吃。', '带走。', '再来一杯。'],
    correct: 1,
  },
  {
    kind: 'listen',
    audio: 'Card or cash?',
    prompt: '店员在问什么？',
    options: ['刷卡还是现金？', '要不要袋子？', '几位？'],
    correct: 0,
  },
  { kind: 'repeat', en: "I'll take this one.", zh: '我要这个。' },
  { kind: 'repeat', en: 'Thank you.', zh: '谢谢。' },
  { kind: 'open', en: "What's your name?", zh: '你叫什么名字？' },
];

export function AssessmentPage() {
  const navigate = useNavigate();
  const speech = useMemo(() => createSpeech(), []);
  const setAssessment = useProgress((state) => state.setAssessment);
  const settings = useProgress((state) => state.progress.settings);
  const [step, setStep] = useState(0);
  const [heard, setHeard] = useState(0);
  const [spoke, setSpoke] = useState(0);
  const [finished, setFinished] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const question = QUESTIONS[step];

  useEffect(() => {
    if (finished) return;
    if (!settings.sound) return;
    const line = question.kind === 'listen' ? question.audio : question.en;
    void speech.speak(line, { rate: settings.rate });
  }, [step, finished, question, settings.rate, settings.sound, speech]);

  const finish = (nextHeard: number, nextSpoke: number) => {
    setAssessment({
      completedAt: new Date().toISOString(),
      heard: nextHeard,
      spoke: nextSpoke,
      skipped: false,
    });
    setFinished(true);
  };

  const advance = (nextHeard = heard, nextSpoke = spoke) => {
    setHeard(nextHeard);
    setSpoke(nextSpoke);
    setTranscript('');
    setAnswer('');
    setNotice(null);
    if (step >= QUESTIONS.length - 1) {
      finish(nextHeard, nextSpoke);
    } else {
      setStep(step + 1);
    }
  };

  const listen = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const result: AsrResult = await speech.listen({ timeoutMs: 12000 });
      setTranscript(result.text);
      if (result.text.trim()) {
        setNotice('听到了。按「继续」就好。');
      } else {
        setNotice('没听清，再说一次，或者按「我说了，继续」。');
      }
    } catch {
      setNotice('麦克风没准备好。可以直接按「我说了，继续」，不影响开始。');
    } finally {
      setBusy(false);
    }
  };

  const skip = () => {
    setAssessment({
      completedAt: new Date().toISOString(),
      heard: 0,
      spoke: 0,
      skipped: true,
    });
    navigate('/home');
  };

  if (finished) {
    return (
      <div className="welcome" style={{ justifyContent: 'center' }}>
        <div className="stack" style={{ textAlign: 'center', alignItems: 'center' }}>
          <span className="pill pill--sage">起点已记录</span>
          <h1 className="display">
            你听懂了 <em>{heard}</em> 句
            <br />
            开口说了 <em>{spoke}</em> 句
          </h1>
          <p className="lede">
            这不叫测试结果，叫今天的起点。从咖啡店开始，第一次只需要 10 分钟。
          </p>
          <div className="welcome__actions" style={{ width: '100%' }}>
            <Link className="button button--primary button--lg button--block" to="/home">
              从咖啡店开始
            </Link>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => {
                setFinished(false);
                setStep(0);
                setHeard(0);
                setSpoke(0);
                setTranscript('');
                setAnswer('');
              }}
            >
              再看一遍题目
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome" style={{ gap: 20 }}>
      <div className="row row--between">
        <span className="pill">
          第 {step + 1} / {QUESTIONS.length} 题
        </span>
        <Button variant="quiet" onClick={skip}>
          跳过，直接开始
        </Button>
      </div>

      <div className="session__steps" aria-hidden="true">
        {QUESTIONS.map((_, index) => (
          <span
            key={index}
            className="session__step"
            data-done={index < step}
            data-active={index === step}
          />
        ))}
      </div>

      <div className="card card__pad stack" style={{ flex: 1, justifyContent: 'center' }}>
        {question.kind === 'listen' ? (
          <>
            <p className="eyebrow">听一句</p>
            <h2 className="npc-line">{question.audio}</h2>
            <p className="lede">{question.prompt}</p>
            <div className="stack stack--sm">
              {question.options.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  className="button button--ghost button--block"
                  onClick={() => {
                    const nextHeard = heard + (index === question.correct ? 1 : 0);
                    setHeard(nextHeard);
                    advance(nextHeard, spoke);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => void speech.speak(question.audio, { rate: settings.rate })}
            >
              <Icon name="play" size={16} /> 再听一遍
            </button>
          </>
        ) : null}

        {question.kind === 'repeat' ? (
          <>
            <p className="eyebrow">跟着说</p>
            <h2 className="npc-line">{question.en}</h2>
            <p className="lede">{question.zh}</p>
            <div className="review-actions">
              <Button variant="ghost" onClick={() => void speech.speak(question.en, { rate: settings.rate })}>
                <Icon name="play" size={16} /> 听示范
              </Button>
              <Button onClick={() => void listen()} disabled={busy || !speech.available}>
                <Icon name="mic" size={16} /> {busy ? '在听…' : '按住说'}
              </Button>
            </div>
            {transcript ? <p className="transcript">听到了：{transcript}</p> : null}
            {notice ? <p className="notice">{notice}</p> : null}
            <Button variant="ghost" block onClick={() => advance(heard, spoke + 1)}>
              我说了，继续
            </Button>
          </>
        ) : null}

        {question.kind === 'open' ? (
          <>
            <p className="eyebrow">说一句自己的</p>
            <h2 className="npc-line">{question.en}</h2>
            <p className="lede">{question.zh} 用英文说，或者说中文都行，先开口。</p>
            <div className="text-answer">
              <input
                className="input"
                value={answer}
                aria-label="你的回答"
                placeholder="I'm ..."
                onChange={(event) => setAnswer(event.target.value)}
              />
              <Button
                onClick={() => {
                  if (!answer.trim()) return;
                  advance(heard, spoke + 1);
                }}
                disabled={!answer.trim()}
              >
                继续
              </Button>
            </div>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => advance(heard, spoke + 1)}
            >
              我直接说了，继续
            </button>
          </>
        ) : null}
      </div>

      <p className="welcome__foot">没有分数，也不会因为结果被拦在门外。</p>
    </div>
  );
}
