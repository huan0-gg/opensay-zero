import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { allChunks, sceneById } from '../../content';
import { createSpeech } from '../../services/speech';
import { recordings, startRecording } from '../../services/recordings';
import { Icon } from '../../ui/Icon';

export function ChunkDetailPage() {
  const { chunkId } = useParams();
  const chunk = allChunks().find((candidate) => candidate.id === chunkId);
  const speech = useMemo(() => createSpeech(), []);
  const [recorder, setRecorder] = useState<{ stop: () => Promise<Blob | null> } | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingNote, setRecordingNote] = useState<string | null>(null);
  const recorderRef = useRef(recorder);
  const audioUrlRef = useRef(audioUrl);
  recorderRef.current = recorder;
  audioUrlRef.current = audioUrl;

  useEffect(
    () => () => {
      void recorderRef.current?.stop();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [],
  );

  if (!chunk) {
    return (
      <div className="empty">
        <p>没有找到这个句块。</p>
        <Link className="button button--ghost" to="/chunks">
          回到句块本
        </Link>
      </div>
    );
  }

  const scene = sceneById(chunk.sceneId);

  return (
    <div className="stack">
      <Link className="back-link" to="/chunks">
        <Icon name="back" size={16} /> 句块本
      </Link>

      <header className="detail-head">
        <p className="eyebrow">
          {scene?.title} · {chunk.tier === 'core' ? '必说' : '能懂'}
        </p>
        <h1 className="display" style={{ fontSize: 'clamp(28px, 6vw, 38px)', fontFamily: 'var(--serif)' }}>
          {chunk.en}
        </h1>
        <p className="lede">{chunk.zh}</p>
      </header>

      <button
        type="button"
        className="button button--ghost button--block"
        onClick={() => void speech.speak(chunk.en, { rate: 0.8 })}
      >
        <Icon name="play" size={18} /> 听示范（0.8 倍速）
      </button>

      <section className="card card__pad stack stack--sm">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          还可以这样说
        </h2>
        {chunk.variants.map((variant) => (
          <div key={variant} className="row row--between">
            <span className="chunk-row__en">{variant}</span>
            <button
              type="button"
              className="play-button"
              aria-label={`播放 ${variant}`}
              onClick={() => void speech.speak(variant, { rate: 0.8 })}
            >
              <Icon name="play" size={14} />
            </button>
          </div>
        ))}
      </section>

      {chunk.tip ? (
        <section className="card card__pad stack stack--sm">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            发音提示
          </h2>
          <p className="lede" style={{ fontSize: 14 }}>
            {chunk.tip}
          </p>
        </section>
      ) : null}

      {chunk.why ? (
        <section className="card card__pad stack stack--sm">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            为什么这么说
          </h2>
          <p className="lede" style={{ fontSize: 14 }}>
            {chunk.why}
          </p>
        </section>
      ) : null}

      <section className="card card__pad stack stack--sm">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          我的录音
        </h2>
        <p className="lede" style={{ fontSize: 13 }}>
          录一遍自己的版本，和示范对比着听。录音只留在这台设备上，30 天后自动清理。
        </p>
        <button
          type="button"
          className={recorder ? 'button button--primary button--block' : 'button button--ghost button--block'}
          onClick={async () => {
            if (recorder) {
              const blob = await recorder.stop();
              setRecorder(null);
              if (blob) {
                const id = await recordings.save(blob);
                const url = await recordings.url(id);
                if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
                setAudioUrl(url);
                setRecordingNote('已保存到本机。');
              } else {
                setRecordingNote('这次没有录到声音，再试一次。');
              }
              return;
            }
            const started = await startRecording();
            if (started) {
              setRecorder(started);
              setRecordingNote('正在录音。说完点一下停止。');
            } else {
              setRecordingNote('麦克风不可用。可以先听示范，跟读到顺为止。');
            }
          }}
        >
          <Icon name={recorder ? 'check' : 'mic'} size={18} />
          {recorder ? '停止并保存' : '录一遍我的发音'}
        </button>
        {recordingNote ? <p className="notice">{recordingNote}</p> : null}
        {audioUrl ? (
          <audio controls src={audioUrl} style={{ width: '100%' }}>
            <track kind="captions" />
          </audio>
        ) : null}
      </section>

      {scene ? (
        <Link className="button button--ghost button--block" to={`/scenes/${scene.id}`}>
          回到场景：{scene.title}
        </Link>
      ) : null}
    </div>
  );
}
