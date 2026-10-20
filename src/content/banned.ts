export const BANNED_WORDS = [
  '很差',
  '太差',
  '糟糕',
  '错误',
  '你说错了',
  '需要加强',
  '多练练',
  '不及格',
  '不达标',
  '口音重',
] as const;

export function containsBannedWord(text: string): boolean {
  return BANNED_WORDS.some((word) => text.includes(word));
}
