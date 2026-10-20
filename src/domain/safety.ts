const SENSITIVE_PATTERNS = [
  /\bdoctor\b/i,
  /\bmedical\b/i,
  /\bmedicine\b/i,
  /\bdiagnos/i,
  /\blawyer\b/i,
  /\blegal\b/i,
  /\bsue\b/i,
  /\binvest/i,
  /\bstocks?\b/i,
  /医生/,
  /看病/,
  /法律/,
  /律师/,
  /投资/,
  /股票/,
  /诊断/,
];

export function isSensitiveTopic(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}
