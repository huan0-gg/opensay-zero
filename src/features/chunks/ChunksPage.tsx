import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { allChunks } from '../../content';
import { createSpeech } from '../../services/speech';
import { Icon } from '../../ui/Icon';
import { Screen } from '../../ui/Screen';

type Filter = 'all' | 'core' | 'understand';

export function ChunksPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const speech = useMemo(() => createSpeech(), []);
  const chunks = allChunks().filter((chunk) => filter === 'all' || chunk.tier === filter);

  return (
    <Screen
      eyebrow={`${allChunks().length} 个句块`}
      title="句块本"
      subtitle="4 个必说，8 个能懂。必说要求自己说出来，能懂只要听明白。"
    >
      <div className="segmented" role="group" aria-label="筛选句块">
        {(
          [
            ['all', '全部'],
            ['core', '必说'],
            ['understand', '能懂'],
          ] as Array<[Filter, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            data-active={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="chunk-list">
        {chunks.map((chunk) => (
          <div key={chunk.id} className="chunk-row" data-testid="chunk-row">
            <Link className="grow" to={`/chunks/${chunk.id}`}>
              <div className="chunk-row__en">{chunk.en}</div>
              <div className="chunk-row__zh">{chunk.zh}</div>
            </Link>
            {chunk.tier === 'core' ? <span className="chunk-row__badge">必说</span> : null}
            <button
              type="button"
              className="play-button"
              aria-label={`播放 ${chunk.en}`}
              onClick={() => void speech.speak(chunk.en, { rate: 0.8 })}
            >
              <Icon name="play" size={16} />
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}
