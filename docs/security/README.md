# 보안 (Security)

이 폴더는 이 저장소의 **보안 감사 결과와 조치 이력**을 모아둔다.

## 파일
- [audit-2026-07-17-run-1.md](audit-2026-07-17-run-1.md) — 1차 보안 감사 보고서(발견·심각도·조치).
- [remediation-log.md](remediation-log.md) — 발견 항목별 수정 내역(코드·커밋·필요 환경변수).

## 감사 방법
- 스킬 `security-audit`(Cloudflare security-audit-skill)로 소스 우선 감사.
- 공격 표면별 독립 헌터 병렬 조사 → 교차검증 → 보고.
- 커버리지 주의: 단일 실행은 전체의 절반 정도만 찾음 → 주기적 재실행 권장.

## 운영자가 반드시 설정할 환경변수 (배포 보안)
Render `book-review-api` 서비스 Environment에 설정:

| 변수 | 용도 | 필수 |
|------|------|------|
| `SESSION_SECRET` | 세션 쿠키 서명 | ✅ (render.yaml `generateValue`) |
| `ADMIN_USERNAMES` | 관리자로 지정할 유저명(쉼표구분). **기본값 없음** | ✅ 관리자 쓰려면 |
| `ADMIN_PASSWORD` | 부팅 시 위 관리자 계정 비밀번호를 이 값으로 재설정(라이브 시드 비번 교정) | 권장 |
| `RESEND_API_KEY` | 이메일 인증 발송. **미설정 시 프로덕션 회원가입 실패(코드 노출 안 함)** | ✅ 회원가입 쓰려면 |
| `KAKAO_REST_API_KEY` | 카카오 로그인 | 소셜 쓰면 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 구글 로그인 | 소셜 쓰면 |

> ⚠️ 과거 시드가 만든 데모/관리자 계정 비밀번호(`password`)가 **이미 라이브 DB에 존재**할 수 있다.
> `ADMIN_USERNAMES`+`ADMIN_PASSWORD`를 설정하고 재배포하면 관리자 비번이 교정된다.
> 데모 계정(bookworm/soyul/cheol/essay)은 관리자 페이지 > 회원 관리에서 삭제하거나 비번을 바꿔둘 것.
