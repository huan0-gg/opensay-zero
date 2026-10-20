import { Link } from 'react-router-dom';
import { allScenes } from '../../content';
import { todayKey } from '../../domain/progress';
import { useProgress } from '../../state/store';
import { Icon } from '../../ui/Icon';
import { Screen } from '../../ui/Screen';

export function ProfilePage() {
  const progress = useProgress((state) => state.progress);
  const completed = allScenes.filter((scene) => progress.scenes[scene.id]?.badge);
  const coreChunks = Object.keys(progress.chunks).length;
  const lastDate = progress.sessions.at(-1)?.date;

  return (
    <Screen
      eyebrow="不排名 · 不比较 · 只看自己"
      title="我的进步"
      subtitle="这里记录的是你「能做到什么」，不是分数。"
      action={
        <Link className="play-button" to="/settings" aria-label="设置">
          <Icon name="settings" size={18} />
        </Link>
      }
    >
      <section className="stats">
        <div className="stat">
          <div className="stat__value">{progress.streak.current}</div>
          <div className="stat__label">连续天数</div>
        </div>
        <div className="stat">
          <div className="stat__value">{progress.sessions.length}</div>
          <div className="stat__label">完成练习</div>
        </div>
        <div className="stat">
          <div className="stat__value">{coreChunks}</div>
          <div className="stat__label">句块在复习</div>
        </div>
      </section>

      <section>
        <h2 className="section-title">能说清单</h2>
        {completed.length === 0 ? (
          <div className="card card__pad stack stack--sm">
            <p className="lede" style={{ fontSize: 14 }}>
              还没有通关的场景。完成一个场景的第 3 天，这里就会多一项「能做到」。
            </p>
            <Link className="button button--ghost button--block" to="/home">
              去练今天这一课
            </Link>
          </div>
        ) : (
          <div className="badge-grid">
            {completed.map((scene) => {
              const first = progress.sessions
                .filter((session) => session.sceneId === scene.id && session.completed)
                .map((session) => session.date)
                .sort()[0];
              return (
                <Link key={scene.id} to={`/scenes/${scene.id}`} className="badge-card" data-earned="true">
                  <Icon name="check" size={18} />
                  <strong>{scene.badge}</strong>
                  <span>首次完成：{first ?? '—'}</span>
                  <span>{scene.finalNote}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title">这个月的证据</h2>
        <div className="card card__pad stack stack--sm">
          <p className="lede" style={{ fontSize: 14 }}>
            最近一次练习：{lastDate ?? '还没有'} · 本机保存
          </p>
          <p className="lede" style={{ fontSize: 14 }}>
            独立开口：近 7 天累计{' '}
            {progress.sessions
              .filter((session) => session.date >= todayKey(new Date(Date.now() - 7 * 86400000)))
              .reduce((sum, session) => sum + session.independentTurns, 0)}{' '}
            轮（非跟读、非提示）。
          </p>
          <p className="lede" style={{ fontSize: 14 }}>
            不展示排名，也不和别的学习者比较。你只需要比上周多说出半句。
          </p>
        </div>
      </section>

      <section className="card card__pad">
        <Link className="row row--between" to="/settings">
          <span>设置、导出与删除数据</span>
          <Icon name="chevron" size={18} />
        </Link>
      </section>
    </Screen>
  );
}
