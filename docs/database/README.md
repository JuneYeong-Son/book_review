# 데이터베이스

책갈피의 데이터 모델(Prisma) 문서.

- [schema.md](schema.md) — 전체 스키마 정리(모델·필드·관계·제약·인덱스·삭제 처리)
- 원본 스키마: [../../server/prisma/schema.prisma](../../server/prisma/schema.prisma)

## 한눈에
- Prisma ORM. 로컬 **SQLite** / 배포 **PostgreSQL**(빌드 시 자동 전환).
- 마이그레이션은 `prisma db push`(migrations 폴더 없음).
- 모델 14개: User·EmailVerification·Feedback·Book·Progress·ReviewComment·Like·Report·Notification·Rating·RecoExclusion·Interest·Discussion·Comment.
