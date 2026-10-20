import { describe, expect, it } from 'vitest';
import { isSensitiveTopic } from './safety';

describe('safety filter', () => {
  it('catches medical, legal and investment questions', () => {
    expect(isSensitiveTopic('Should I take this medicine?')).toBe(true);
    expect(isSensitiveTopic('I need a lawyer')).toBe(true);
    expect(isSensitiveTopic('where should I invest my money?')).toBe(true);
    expect(isSensitiveTopic('我该投资股票吗')).toBe(true);
  });

  it('leaves ordinary ordering lines alone', () => {
    expect(isSensitiveTopic('How much is this?')).toBe(false);
    expect(isSensitiveTopic("I'll take this one, please")).toBe(false);
    expect(isSensitiveTopic('To go, please')).toBe(false);
  });
});
