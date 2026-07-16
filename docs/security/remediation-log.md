# 보안 조치 로그 (Remediation Log)

> 감사에서 나온 항목의 **수정 내역**. 최신이 위. 상세 진단은 [audit-*.md](audit-2026-07-17-run-1.md).

## 2026-07-17 — 1차 감사 전 항목 조치 (커밋 `e4cf9ec`)

| ID | 파일 | 수정 |
|----|------|------|
| C1 | `server/prisma/seed.ts`, `server/src/lib/bootstrap.ts` | 프로덕션 시드 공개비번 제거(데모 랜덤/관리자 env), bootstrap 기본 `reader` 제거 + `ADMIN_PASSWORD` 재설정 지원 |
| H1 | `server/src/service/oauth_service.ts` | 제공자 이메일 검증 플래그 확인 후에만 이메일 연결 |
| M1 | `server/src/controller/auth_controller.ts`, `oauth_service.ts` | OAuth `state` 생성·서명쿠키 대조 |
| M2 | `server/src/service/email_service.ts`, `auth_service.ts` | 프로덕션 devCode 노출 차단, 키 없으면 fail-closed |
| M3 | `server/src/service/admin_service.ts` | 신고글 삭제 경로에서 관리자 삭제 차단 |
| 하드닝 | `server/src/index.ts`, `auth_controller.ts` | 기본 보안 헤더, `/check` 스로틀 |

### 운영자(사용자) 조치 필요 — 라이브 반영
1. Render `book-review-api` 환경변수:
   - `ADMIN_USERNAMES` = 본인 관리자 계정 유저명
   - `ADMIN_PASSWORD` = 강한 비밀번호(8자+) → 재배포 시 관리자 비번 교정
   - `RESEND_API_KEY` = 이메일 발송(미설정 시 프로덕션 회원가입 실패)
2. 재배포 후 관리자 페이지 > 회원 관리에서 **데모 계정(bookworm/soyul/cheol/essay)** 삭제 또는 비번 변경.
3. 소셜 로그인 정식 오픈 전 카카오/구글 키 등록 확인.
