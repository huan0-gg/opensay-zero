import { Link } from 'react-router-dom';
import { sceneById } from '../../content';
import { todayKey } from '../../domain/progress';
import { todayPlan } from '../../domain/plan';
import { useProgress } from '../../state/store';
import { Icon } from '../../ui/Icon';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function weekStartKey(now = new Date()): string {
  const date = new Date(now);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return todayKey(date);
}

export function HomePage() {
  const progress = useProgress((state) => state.progress);
  const recovered = useProgress((state) => state.recovered);
  const dismissRecovery = useProgress((state) => state.dismissRecovery);
  const plan = todayPlan(progress);
  const scene = sceneById(plan.sceneId);
  const today = todayKey();
  const scheduledToday = progress.sessions
    .filter((session) => session.date === today && session.completed && session.scheduled)
    .at(-1);
  const doneToday = Boolean(
    scheduledToday && scheduledToday.planIndex === progress.planIndex - 1,
  );
  const todaySession = scheduledToday;
  const startKey = weekStartKey();
  const weekTurns = progress.sessions
    .filter((session) => session.date >= startKey)
    .reduce((sum, session) => sum + session.independentTurns, 0);
  const currentWeek = Math.min(4, Math.floor(plan.index / 5) + 1);
  const badges = Object.values(progress.scenes).filter((sceneProgress) => sceneProgress?.badge).length;
  const todayChunk = scene?.chunks.find((chunk) => chunk.tier === 'core');

  return (
    <div className="home">
      <header className="stack stack--sm">
        <p className="hello__time">{greeting()}，</p>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 5.5vw, 34px)' }}>
          今天，先开口
        </h1>
        <p className="lede">每天只做一件事：把今天这几句，说成自己的。</p>
      </header>

      {recovered ? (
        <div className="notice">
          这台设备上的进度文件读不出来，已从空白开始，避免带着坏数据继续。
          <button type="button" className="button button--quiet" onClick={dismissRecovery}>
            知道了
          </button>
        </div>
      ) : null}

      {doneToday && !plan.allDone ? (
        <div className="done-banner">
          <Icon name="check" size={20} />
          <div>
            <strong>今天已完成</strong>
            <span>说出口就算数。明天见。</span>
          </div>
        </div>
      ) : null}

      {plan.allDone ? (
        <div className="done-banner">
          <Icon name="spark" size={20} />
          <div>
            <strong>20 次练完了</strong>
            <span>你已经走完这 4 周。接下来去真实场景里说。</span>
          </div>
        </div>
      ) : null}

      <section className="card today-card" aria-label="今日计划">
        <div className="today-card__label">
          <span>
            {plan.allDone ? '20 / 20 次 · 全部完成' : `第 ${plan.index + 1} / 20 次 · 第 ${currentWeek} 周`}
          </span>
          <span>{scene?.domain ?? '场景'}</span>
        </div>
        <div>
          <h2 className="today-card__title">
            {plan.allDone ? '4 周走完了' : scene?.title ?? '今天的场景'}
          </h2>
          <p className="today-card__sub">
            {plan.kind === 'final'
              ? '终测：这一次，换一个价格，换一种问法。'
              : plan.kind === 'variation'
                ? '变体练习：同一场景，换一个说法。'
                : scene?.subtitle}
          </p>
        </div>

        {!plan.allDone ? (
          <div className="minutes" aria-label="10 分钟分配">
            <div className="minutes__piece">
              <strong>3 分钟</strong>
              复习
            </div>
            <div className="minutes__piece">
              <strong>5 分钟</strong>
              对话
            </div>
            <div className="minutes__piece">
              <strong>2 分钟</strong>
              复盘
            </div>
          </div>
        ) : null}

        {plan.allDone ? (
          <Link className="button button--primary button--lg button--block" to="/scenes">
            回场景里再练一次
          </Link>
        ) : doneToday ? (
          <Link
            className="button button--ghost button--block"
            to={`/session/${todaySession?.sceneId ?? plan.sceneId}?day=${todaySession?.day ?? plan.day}&kind=${todaySession?.kind ?? plan.kind}`}
          >
            再练一次今天的场景
          </Link>
        ) : (
          <Link
            className="button button--primary button--lg button--block"
            to={`/session/${plan.sceneId}?day=${plan.day}&kind=${plan.kind}`}
          >
            开始今天的 10 分钟
          </Link>
        )}

        {!plan.allDone ? (
          <p className="today-card__sub">
            {plan.reviewCount > 0
              ? `${plan.reviewCount} 个句块到期，先复习再对话。`
              : '今天没有到期句块，直接进对话。'}
          </p>
        ) : (
          <p className="today-card__sub">想保持手感，就回场景里挑一个再走一遍。</p>
        )}
      </section>

      <section>
        <h2 className="section-title">这 4 周</h2>
        <div className="week-track">
          {[1, 2, 3, 4].map((week) => {
            const done = Math.max(0, Math.min(5, plan.index - (week - 1) * 5));
            const state = done >= 5 ? 'done' : week === currentWeek ? 'active' : 'idle';
            return (
              <div key={week} className="week-track__item" data-state={state}>
                <strong>第 {week} 周</strong>
                {done >= 5 ? '已完成' : `${done} / 5 次`}
              </div>
            );
          })}
        </div>
      </section>

      <section className="stats" aria-label="我的数据">
        <div className="stat">
          <div className="stat__value">{progress.streak.current}</div>
          <div className="stat__label">连续天数</div>
        </div>
        <div className="stat">
          <div className="stat__value">{weekTurns}</div>
          <div className="stat__label">本周独立开口</div>
        </div>
        <div className="stat">
          <div className="stat__value">{badges}/5</div>
          <div className="stat__label">能说场景</div>
        </div>
      </section>

      <section>
        <h2 className="section-title">今天的一句</h2>
        <div className="card card__pad stack stack--sm">
          <p className="chunk-row__en">{todayChunk?.en ?? 'How much is this?'}</p>
          <p className="lede" style={{ fontSize: 14 }}>
            不用背语法。先把它说顺，再换成你自己的东西。
          </p>
        </div>
      </section>
    </div>
  );
}
