import { describe, expect, it } from 'vitest';
import { isExpired } from './recordings';
import { FakeSpeech, SpeechUnavailableError } from './speech';

describe('fake speech', () => {
  it('returns queued transcripts in order', async () => {
    const speech = new FakeSpeech();
    speech.queueResult('how much is this', 0.9);
    await expect(speech.listen()).resolves.toEqual({
      text: 'how much is this',
      confidence: 0.9,
      source: 'voice',
    });
  });

  it('reports unavailable when there is no scripted result', async () => {
    const speech = new FakeSpeech();
    await expect(speech.listen()).rejects.toBeInstanceOf(SpeechUnavailableError);
  });

  it('records speech and cancellation', async () => {
    const speech = new FakeSpeech();
    await speech.speak('hello');
    expect(speech.spoken).toEqual(['hello']);
    speech.cancel();
    expect(speech.cancelled).toBe(true);
  });
});

describe('recordings retention', () => {
  it('expires a recording after thirty days', () => {
    const created = '2026-09-01T00:00:00.000Z';
    expect(isExpired(created, new Date('2026-10-20T00:00:00.000Z'))).toBe(true);
    expect(isExpired(created, new Date('2026-09-10T00:00:00.000Z'))).toBe(false);
    expect(isExpired('2026-10-01T00:00:00.000Z', new Date('2026-10-20T00:00:00.000Z'))).toBe(false);
  });
});
