import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.ts';

const createHash = (password: string) => bcrypt.hashSync(password, 8);

async function main() {
  // 초기화: 관계 순서에 맞춰 삭제
  await prisma.comment.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.interest.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  const reader = await prisma.user.create({
    data: {
      username: 'reader',
      name: '독서가',
      avatar: '🦊',
      passwordHash: createHash('password')
    }
  });

  await prisma.book.createMany({
    data: [
      { id: 'b1', title: '작은 아씨들', author: '루이자 메이 올콧', genre: '고전소설', category: '해외문학', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80' },
      { id: 'b2', title: '데미안', author: '헤르만 헤세', genre: '성장소설', category: '해외문학', cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80' },
      { id: 'b3', title: '82년생 김지영', author: '조남주', genre: '현대소설', category: '한국문학', cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80' },
      { id: 'b4', title: '어린 왕자', author: '앙투안 드 생텍쥐페리', genre: '동화', category: '해외문학', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' }
    ]
  });

  // 예시 기록: 독서가가 데미안을 날짜별로 두 번 기록
  await prisma.progress.create({
    data: {
      userId: reader.id, bookId: 'b2',
      startPage: 0, endPage: 60,
      note: '싱클레어의 어린 시절이 인상적', quote: '새는 알에서 나오려고 투쟁한다.', rating: 4
    }
  });
  await prisma.progress.create({
    data: {
      userId: reader.id, bookId: 'b2',
      startPage: 60, endPage: 120,
      note: '데미안과의 만남 이후 성장에 몰입', quote: '', rating: 5
    }
  });

  console.log('Seed 완료: user=reader / password=password');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
