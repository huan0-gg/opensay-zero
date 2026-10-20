import { useState } from 'react';
import type { Chunk, Settings } from '../../domain/types';
import type { SpeechPort } from '../../services/speech';
import { useProgress } from '../../state/store';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

interface Props {
  chunks: Chunk[];
  speech: SpeechPort;
  settings: Settings;
  onDone: () => void;
}

export function ReviewPhase({ chunks, speech, settings, onDone }: Props) {
  const recordChunkResult = useProgress((state) => state.recordChunkResult);
  const [index, setIndex] = useState(0);
  const [support, setSupport] = useState(false);
  const chunk = chunks[index];

  if (!chunk) return null;

  const play = (rate: number = settings.rate) => {
    void speech.speak(chunk.en, { rate });
  };

  const answer = (pass: boolean) => {
    recordChunkResult(chunk.id, pass ? 'pass' : 'fail');
    if (index + 1 >= chunks.length) {
      onDone();
      return;
    }
    setIndex(index + 1);
    setSupport(false);
  };

  return (
    <div className="review">
      <div className="row row--between">
        <p className="eyebrow">复习 · {index + 1} / {chunks.length}</p>
        <button type="button" className="button button--quiet" onClick={onDone}>
          跳过
        </button>
      </div>

      <div className="card review-card">
        <Button variant="ghost" onClick={() => play()}>
          <Icon name="play" size={18} /> 听示范
        </Button>
        <p className="review-card__en">{chunk.en}</p>
        <p className="review-card__zh">{chunk.zh}</p>
        {support ? (
          <p className="notice">
            先听慢速，再跟着说。第一个词是「{chunk.en.split(' ')[0]}」。
          </p>
        ) : null}
        {support ? (
          <Button variant="ghost" onClick={() => play(0.6)}>
            <Icon name="play" size={16} /> 0.6 倍速
          </Button>
        ) : null}
      </div>

      <p className="today-card__sub" style={{ textAlign: 'center' }}>
        不用打分，只判断：这句你刚才自己说出来了吗？
      </p>

      <div className="review-actions">
        <Button variant="ghost" onClick={() => (support ? answer(false) : setSupport(true))}>
          {support ? '还是没说出来' : '还没说出来'}
        </Button>
        <Button onClick={() => answer(true)}>说对了</Button>
      </div>

      <p className="welcome__foot">
        先听慢速跟读；跟读后还是说不出来，再记为一次失败。
      </p>
    </div>
  );
}
