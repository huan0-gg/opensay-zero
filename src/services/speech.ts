import type { AsrResult } from '../domain/types';

export interface SpeakOptions {
  rate?: number;
}

export interface SpeechPort {
  readonly available: boolean;
  speak(text: string, options?: SpeakOptions): Promise<void>;
  cancel(): void;
  listen(options?: { timeoutMs?: number }): Promise<AsrResult>;
}

export class SpeechUnavailableError extends Error {
  constructor(message = 'speech is not available') {
    super(message);
    this.name = 'SpeechUnavailableError';
  }
}

export function createSpeech(options?: { forceFake?: boolean }): SpeechPort {
  if (options?.forceFake) return new FakeSpeech(false);
  if (typeof window === 'undefined') return new FakeSpeech(false);

  const params = new URLSearchParams(window.location.search);
  const e2e =
    params.get('e2e') === '1' ||
    (() => {
      try {
        return window.localStorage.getItem('opensay.e2e') === '1';
      } catch {
        return false;
      }
    })();
  if (e2e) return new FakeSpeech(false);

  return new WebSpeech();
}

export class FakeSpeech implements SpeechPort {
  readonly available: boolean;
  cancelled = false;
  spoken: string[] = [];
  private queue: AsrResult[] = [];

  constructor(available = true) {
    this.available = available;
  }

  queueResult(text: string, confidence = 0.9, source: AsrResult['source'] = 'voice') {
    this.queue.push({ text, confidence, source });
  }

  async speak(text: string): Promise<void> {
    this.spoken.push(text);
  }

  cancel(): void {
    this.cancelled = true;
  }

  async listen(): Promise<AsrResult> {
    const next = this.queue.shift();
    if (!next) throw new SpeechUnavailableError('no scripted speech result');
    return next;
  }

  reset(): void {
    this.cancelled = false;
    this.spoken = [];
    this.queue = [];
  }
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface RecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>>;
}

type RecognitionCtor = new () => RecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

export class WebSpeech implements SpeechPort {
  readonly available: boolean;
  private current: { resolve: () => void; utterance: SpeechSynthesisUtterance; timer: number } | null =
    null;

  constructor() {
    this.available = Boolean(recognitionCtor());
  }

  speak(text: string, options?: SpeakOptions): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }
    const synth = window.speechSynthesis;
    synth.cancel();

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = options?.rate ?? 0.8;
      const voices = synth.getVoices();
      const preferred =
        voices.find((voice) => voice.lang === 'en-US' && /female|samantha|zira|aria/i.test(voice.name)) ??
        voices.find((voice) => voice.lang === 'en-US') ??
        voices.find((voice) => voice.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;

      const finish = () => {
        window.clearTimeout(timer);
        if (this.current?.utterance === utterance) this.current = null;
        resolve();
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      // A missing or silent voice must never hold the dialogue in "responding".
      const timer = window.setTimeout(finish, 8000);
      this.current = { resolve, utterance, timer };
      synth.speak(utterance);
    });
  }

  cancel(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const current = this.current;
    this.current = null;
    if (current) window.clearTimeout(current.timer);
    current?.resolve();
  }

  listen(options?: { timeoutMs?: number }): Promise<AsrResult> {
    const Ctor = recognitionCtor();
    if (!Ctor) return Promise.reject(new SpeechUnavailableError());

    return new Promise<AsrResult>((resolve, reject) => {
      const recognition = new Ctor();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        fn();
      };

      const timer = window.setTimeout(() => {
        recognition.abort();
        finish(() => reject(new SpeechUnavailableError('recognition timed out')));
      }, options?.timeoutMs ?? 12000);

      recognition.onresult = (event) => {
        const alternative = event.results?.[0]?.[0];
        const text = alternative?.transcript?.trim() ?? '';
        const confidence = alternative?.confidence ?? 0.5;
        finish(() => resolve({ text, confidence, source: 'voice' }));
      };
      recognition.onerror = (event) => {
        finish(() => reject(new SpeechUnavailableError(event.error)));
      };
      recognition.onend = () => {
        finish(() => reject(new SpeechUnavailableError('no speech detected')));
      };

      try {
        recognition.start();
      } catch (error) {
        finish(() => reject(error instanceof Error ? error : new SpeechUnavailableError()));
      }
    });
  }
}
