// 배포(Render) 빌드 시에만 실행: Prisma provider를 sqlite → postgresql 로 전환.
// 로컬 개발은 sqlite 유지(Docker/Postgres 불필요), 배포는 Postgres 사용.
import { readFileSync, writeFileSync } from 'node:fs';

const schemaPath = new URL('../prisma/schema.prisma', import.meta.url);
let schema = readFileSync(schemaPath, 'utf8');

if (schema.includes('provider = "sqlite"')) {
  schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
  writeFileSync(schemaPath, schema);
  console.log('Prisma datasource provider → postgresql (배포용)');
} else {
  console.log('이미 postgresql provider (변경 없음)');
}
