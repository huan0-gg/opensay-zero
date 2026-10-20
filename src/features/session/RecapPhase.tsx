import type { Correction, Scene } from '../../domain/types';
import { selectCorrections } from '../../domain/corrections';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import type { SessionStats } from './session-types';

interface Props {
  scene: Scene;
  day: 1 | 2 | 3;
  kind: 'scene' | 'variation' | 'final';
  stats: SessionStats;
  corrections: Correction[];
  nextSceneTitle?: string;
  onComplete: () => void;
}

export function RecapPhase({ scene, day, kind, stats, corrections, nextSceneTitle, onComplete }: Props) {
  const shown = selectCorrections(corrections);
  const saidChunks = scene.chunks.filter((chunk) => stats.chunksUsed.includes(chunk.id));

  return (
    <div className="recap">
      <div className="recap__hero">
        <span className="pill pill--sage">
          {kind === 'final' ? '终测' : day === 3 ? '第 3 天 · 全开放' : `第 ${day} 天`}
        </span>
        <p className="recap__count">{saidChunks.length}</p>
        <h1 className="display" style={{ fontSize: 'clamp(24px, 5vw, 32px)' }}>
          今天说对了 {saidChunks.length} 句
        </h1>
        <p className="lede" style={{ maxWidth: 420 }}>
          {day === 3 || kind !== 'scene'
            ? '你自己走完了这一段。下面是把明天能带走的东西。'
            : '不用记住全部，记住你今天真的说出口的那几句。'}
        </p>
      </div>

      <section>
        <h2 className="section-title">今天说出口的</h2>
        <div className="card card__pad stack stack--sm">
          {saidChunks.length ? (
            saidChunks.map((chunk) => (
              <div key={chunk.id} className="row row--between">
                <span className="chunk-row__en">{chunk.en}</span>
                <Icon name="check" size={16} />
              </div>
            ))
          ) : (
            <p className="lede" style={{ fontSize: 14 }}>
              今天还没有完整的句子被记下来。明天再试一次，先从「How much is this?」开始。
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title">最多 3 条修正</h2>
        {shown.length ? (
          <div className="stack stack--sm">
            {shown.map((correction) => (
              <article key={`${correction.kind}-${correction.better}`} className="correction" data-testid="correction">
                <p className="correction__label">你说的</p>
                <p className="correction__said">{correction.said}</p>
                <p className="correction__label">更自然</p>
                <p className="correction__better">{correction.better}</p>
                <p className="correction__label">为什么</p>
                <p className="correction__why">{correction.why}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="card card__pad">
            <p className="lede" style={{ fontSize: 14 }}>
              这次没有影响理解的表达问题。能把话说出去，比说得完美更重要。
            </p>
          </div>
        )}
      </section>

      <section className="mission">
        <strong>明天真的用一次：</strong> {scene.mission.zh}
      </section>

      {day === 3 && kind === 'scene' ? (
        <div className="card card__pad row" style={{ background: 'var(--sage-soft)' }}>
          <Icon name="spark" size={22} />
          <div>
            <strong>{scene.badge}</strong>
            <p style={{ fontSize: 13, marginTop: 2 }}>{scene.finalNote}</p>
          </div>
        </div>
      ) : null}

      {nextSceneTitle ? (
        <p className="today-card__sub">明天：{nextSceneTitle}。还是 10 分钟，还是先说一句。</p>
      ) : (
        <p className="today-card__sub">20 次练习到这里就齐了。接下来，去真实场景里说。</p>
      )}

      <Button size="lg" block onClick={onComplete}>
        完成，回到今天
      </Button>

      <p className="welcome__foot">
        今天的记录只在这台设备上。没有排名，也不和任何人比较。
      </p>
    </div>
  );
}
