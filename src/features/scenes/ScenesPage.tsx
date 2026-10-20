import { Link } from 'react-router-dom';
import { allScenes } from '../../content';
import { nextAssignment } from '../../domain/plan';
import { useProgress } from '../../state/store';
import { Icon } from '../../ui/Icon';
import { Screen } from '../../ui/Screen';

export function ScenesPage() {
  const progress = useProgress((state) => state.progress);
  const assignment = nextAssignment(progress);
  const started = new Set(Object.keys(progress.scenes));

  return (
    <Screen
      eyebrow="5 个场景 · 每个 3 天"
      title="先练马上要用的"
      subtitle="每个场景练三天：第一天学，第二天复现，第三天自己走一遍。"
    >
      <div className="list">
        {allScenes.map((scene) => {
          const sceneProgress = progress.scenes[scene.id];
          const unlocked = started.has(scene.id) || scene.id === assignment.sceneId;
          return (
            <Link
              key={scene.id}
              to={`/scenes/${scene.id}`}
              className="card scene-card"
              data-testid="scene-card"
              data-locked={!unlocked}
              aria-label={`${scene.title}${unlocked ? '' : '（未解锁）'}`}
            >
              <span className="scene-card__num">{scene.order}</span>
              <span className="scene-card__body">
                <span className="scene-card__title">
                  {scene.title}
                  {!unlocked ? <Icon name="lock" size={14} /> : null}
                  {sceneProgress?.badge ? <span aria-label="已通关">✓</span> : null}
                </span>
                <span className="scene-card__sub">{scene.subtitle}</span>
                <span className="scene-card__meta">
                  <span className="pill">L{scene.level}</span>
                  <span className="pill">{scene.week} 周</span>
                  <span className="day-dots" aria-label="三天进度">
                    {[1, 2, 3].map((day) => (
                      <span
                        key={day}
                        className="day-dot"
                        data-done={Boolean(sceneProgress?.completedDays.includes(day))}
                      />
                    ))}
                  </span>
                </span>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          );
        })}
      </div>
    </Screen>
  );
}
