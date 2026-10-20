import { Link, useParams } from 'react-router-dom';
import { sceneById } from '../../content';
import { nextAssignment } from '../../domain/plan';
import { useProgress } from '../../state/store';
import { Icon } from '../../ui/Icon';

export function SceneDetailPage() {
  const { sceneId } = useParams();
  const scene = sceneId ? sceneById(sceneId) : undefined;
  const progress = useProgress((state) => state.progress);
  const assignment = nextAssignment(progress);

  if (!scene) {
    return (
      <div className="empty">
        <p>没有找到这个场景。</p>
        <Link className="button button--ghost" to="/scenes">
          回到场景列表
        </Link>
      </div>
    );
  }

  const sceneProgress = progress.scenes[scene.id];
  const unlocked = Boolean(sceneProgress) || scene.id === assignment.sceneId;
  const nextDay = ([1, 2, 3] as const).find((value) => !sceneProgress?.completedDays.includes(value)) ?? 3;
  const allDone = sceneProgress?.completedDays.length === 3;
  const core = scene.chunks.filter((chunk) => chunk.tier === 'core');
  const understand = scene.chunks.filter((chunk) => chunk.tier === 'understand');

  return (
    <div className="stack">
      <Link className="back-link" to="/scenes">
        <Icon name="back" size={16} /> 场景
      </Link>

      <header className="detail-head">
        <p className="eyebrow">
          {scene.domain} · L{scene.level} · 第 {scene.week} 周
        </p>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 6vw, 38px)' }}>
          {scene.title}
        </h1>
        <p className="lede">{scene.subtitle}</p>
      </header>

      <section className="card card__pad stack stack--sm">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          三天里你会做到
        </h2>
        <ul className="stack stack--sm">
          {scene.objectives.map((objective) => (
            <li key={objective} className="row" style={{ alignItems: 'flex-start' }}>
              <Icon name="check" size={16} />
              <span style={{ fontSize: 14, lineHeight: 1.6 }}>{objective}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="section-title">4 个必说（要能自己说）</h2>
        <div className="chunk-list">
          {core.map((chunk) => (
            <div key={chunk.id} className="chunk-row" style={{ cursor: 'default' }}>
              <div className="grow">
                <div className="chunk-row__en">{chunk.en}</div>
                <div className="chunk-row__zh">{chunk.zh}</div>
              </div>
              <span className="chunk-row__badge">必说</span>
            </div>
          ))}
        </div>
      </section>

      <details className="card card__pad">
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>8 个能懂（听懂、选对义）</summary>
        <div className="chunk-list" style={{ marginTop: 12 }}>
          {understand.map((chunk) => (
            <div key={chunk.id} className="chunk-row" style={{ cursor: 'default' }}>
              <div className="grow">
                <div className="chunk-row__en">{chunk.en}</div>
                <div className="chunk-row__zh">{chunk.zh}</div>
              </div>
            </div>
          ))}
        </div>
      </details>

      <section className="mission">
        <strong>明天真的用一次：</strong> {scene.mission.zh}
      </section>

      {unlocked ? (
        <Link
          className="button button--primary button--lg button--block"
          to={`/session/${scene.id}?day=${nextDay}&kind=scene`}
        >
          {allDone ? '再练一遍第 3 天' : `开始第 ${nextDay} 天`}
        </Link>
      ) : (
        <div className="notice">
          这个场景还没解锁。先完成第 {assignment.index + 1} 次练习，就会轮到这里。
        </div>
      )}

      <p className="today-card__sub">
        {sceneProgress?.completedDays.length
          ? `已完成第 ${sceneProgress.completedDays.join('、')} 天。`
          : '还没有开始。第一次大约 10 分钟。'}
      </p>
    </div>
  );
}
