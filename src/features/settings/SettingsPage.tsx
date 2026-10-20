import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseProgress, todayKey } from '../../domain/progress';
import { recordings } from '../../services/recordings';
import { useProgress } from '../../state/store';
import { Icon } from '../../ui/Icon';
import { Screen } from '../../ui/Screen';

export function SettingsPage() {
  const progress = useProgress((state) => state.progress);
  const updateSettings = useProgress((state) => state.updateSettings);
  const replace = useProgress((state) => state.replace);
  const reset = useProgress((state) => state.reset);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    if (typeof URL.createObjectURL !== 'function') {
      setMessage('这个浏览器不支持导出文件。');
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `opensay-${todayKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('已导出。把文件收好，换设备时可以再导入。');
  };

  const importData = async (file: File) => {
    const text = await file.text();
    const { progress: parsed, recovered } = parseProgress(text);
    if (recovered) {
      setMessage('这个文件读不出来，进度没有改动。');
      return;
    }
    replace(parsed);
    setMessage('已导入。刷新页面后仍然是这份进度。');
  };

  return (
    <div className="stack">
      <Link className="back-link" to="/profile">
        <Icon name="back" size={16} /> 我的
      </Link>

      <Screen eyebrow="都在本机" title="设置" subtitle="没有账号，没有云端。换个设备就用导出文件带走。">
        <section className="card card__pad">
          <div className="setting-row">
            <div>
              <div className="setting-row__label">示范语速</div>
              <div className="setting-row__hint">听不清就放慢，听懂了再提速。</div>
            </div>
            <div className="segmented" role="group" aria-label="示范语速">
              {([0.8, 1, 1.2] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  data-active={progress.settings.rate === rate}
                  onClick={() => updateSettings({ rate })}
                >
                  {rate}×
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-row__label">字幕</div>
              <div className="setting-row__hint">第 1 周建议中英一起看，第 3 周试着关掉中文。</div>
            </div>
            <div className="segmented" role="group" aria-label="字幕">
              {(
                [
                  ['en-zh', '中英'],
                  ['en', '英文'],
                  ['off', '关'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  data-active={progress.settings.subtitles === value}
                  onClick={() => updateSettings({ subtitles: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <div>
              <div className="setting-row__label">声音</div>
              <div className="setting-row__hint">关掉后只看字幕，对话仍然可以完成。</div>
            </div>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={progress.settings.sound}
              aria-label="声音"
              data-on={progress.settings.sound}
              onClick={() => updateSettings({ sound: !progress.settings.sound })}
            />
          </div>
        </section>

        <section className="card card__pad stack stack--sm">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            数据
          </h2>
          <button type="button" className="button button--ghost button--block" onClick={exportData}>
            <Icon name="download" size={18} /> 导出进度（JSON）
          </button>
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" size={18} /> 导入进度
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            aria-label="选择进度文件"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importData(file);
              event.target.value = '';
            }}
          />
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={async () => {
              await recordings.clear();
              setMessage('本机录音已清空。');
            }}
          >
            <Icon name="trash" size={18} /> 删除本机录音
          </button>
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={() => {
              if (window.confirm('会清空所有进度与录音，确定吗？')) {
                void recordings.clear();
                reset();
                setMessage('已重置。可以从第一天重新开始。');
              }
            }}
          >
            清空所有进度
          </button>
          {message ? <p className="notice">{message}</p> : null}
        </section>

        <p className="today-card__sub">
          录音默认只在这台设备上，30 天后自动清理。这个版本不上传录音，也不做云同步。
        </p>
      </Screen>
    </div>
  );
}
