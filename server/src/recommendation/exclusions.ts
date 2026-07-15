// 추천 목록에서 제외할 책 제목. 코드 기본값 + 환경변수(RECO_EXCLUDE_TITLES, 쉼표구분)로 확장.
const HARD = ['82년생 김지영'];
const fromEnv = (process.env.RECO_EXCLUDE_TITLES ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const excluded = new Set([...HARD, ...fromEnv]);

export const isExcludedTitle = (title?: string) => !!title && excluded.has(title.trim());
