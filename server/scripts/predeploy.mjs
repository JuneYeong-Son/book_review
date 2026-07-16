// 배포 빌드 중 `prisma db push` 직전에 실행.
// Report에 새로 추가되는 unique([reporterId,targetType,targetId]) 제약이
// 기존 중복 신고 때문에 실패하지 않도록, 그룹별 1행만 남기고 중복을 제거한다.
// (첫 배포 등으로 테이블이 아직 없으면 조용히 건너뛴다.)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Report" a USING "Report" b
    WHERE a.ctid < b.ctid
      AND a."reporterId" = b."reporterId"
      AND a."targetType" = b."targetType"
      AND a."targetId"   = b."targetId";
  `);
  console.log('[predeploy] Report 중복 신고 제거 완료');
} catch (err) {
  console.log('[predeploy] Report 중복 제거 건너뜀:', err.message);
} finally {
  await prisma.$disconnect();
}
