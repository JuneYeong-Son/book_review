import bcrypt from 'bcryptjs';
import prisma from '../src/lib/prisma.ts';
import { searchExternalBooks } from '../src/service/book_import_service.ts';

const createHash = (password: string) => bcrypt.hashSync(password, 8);

// 알라딘에서 실제 표지·장르·카테고리를 가져와 시드 책을 보강 (키 없으면 폴백값 사용)
const enrichFromAladin = async (seed: {
  id: string;
  title: string;
  author: string;
  genre: string;
  category: string;
  cover: string;
}) => {
  try {
    const result = await searchExternalBooks(seed.title);
    if (!('error' in result) && result.candidates.length > 0) {
      const c = result.candidates[0];
      return {
        id: seed.id,
        title: seed.title,
        author: seed.author,
        cover: c.cover || seed.cover,
        genre: c.genre || seed.genre,
        category: c.category || seed.category,
        isbn: c.isbn || null,
        publisher: c.publisher ?? '',
        description: c.description ?? ''
      };
    }
  } catch {
    // 네트워크 실패 시 폴백
  }
  return {
    id: seed.id,
    title: seed.title,
    author: seed.author,
    cover: seed.cover,
    genre: seed.genre,
    category: seed.category,
    isbn: null,
    publisher: '',
    description: ''
  };
};

async function main() {
  // 배포(재배포) 시 데이터가 이미 있으면 시드를 건너뜀 (데이터 보존)
  if (process.env.SEED_SKIP_IF_DATA === '1' && (await prisma.user.count()) > 0) {
    console.log('이미 데이터가 있어 시드를 건너뜁니다.');
    return;
  }

  // 초기화: 외래키 제약을 위해 자식 테이블부터 삭제
  await prisma.notification.deleteMany();
  await prisma.like.deleteMany();
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
      birthYear: 1994,
      passwordHash: createHash('password')
    }
  });

  const bookworm = await prisma.user.create({
    data: {
      username: 'bookworm',
      name: '책벌레',
      avatar: '🐰',
      birthYear: 2001,
      passwordHash: createHash('password')
    }
  });

  const seedBooks = [
    { id: 'b1', title: '작은 아씨들', author: '루이자 메이 올콧', genre: '고전소설', category: '해외문학', cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80' },
    { id: 'b2', title: '데미안', author: '헤르만 헤세', genre: '성장소설', category: '해외문학', cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=400&q=80' },
    { id: 'b3', title: '82년생 김지영', author: '조남주', genre: '현대소설', category: '한국문학', cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80' },
    { id: 'b4', title: '어린 왕자', author: '앙투안 드 생텍쥐페리', genre: '동화', category: '해외문학', cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' }
  ];
  for (const seed of seedBooks) {
    const data = await enrichFromAladin(seed);
    await prisma.book.create({ data });
  }

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
      note: '데미안과의 만남 이후 성장에 몰입', quote: '내 안에서 솟아 나오려는 것, 그것을 나는 살아보려 했다.', rating: 5
    }
  });

  // 책벌레: 작은 아씨들 기록
  await prisma.progress.create({
    data: {
      userId: bookworm.id, bookId: 'b1',
      startPage: 0, endPage: 90,
      note: '네 자매의 일상이 따뜻하다', quote: '', rating: 4
    }
  });

  // 토론 시드 (토론을 연 사람은 그 책의 기록이 있어야 함)
  const d1 = await prisma.discussion.create({
    data: {
      bookId: 'b2', ownerId: reader.id,
      title: '데미안, 알을 깨는 고통에 대하여',
      description: '싱클레어의 성장에서 가장 인상 깊었던 장면을 나눠요.'
    }
  });
  const d2 = await prisma.discussion.create({
    data: {
      bookId: 'b1', ownerId: bookworm.id,
      title: '작은 아씨들 중 최애 캐릭터는?',
      description: '조, 메그, 베스, 에이미 중 누구에게 가장 공감하나요?'
    }
  });

  // 댓글 시드
  await prisma.comment.create({
    data: { discussionId: d1.id, userId: bookworm.id, text: '새가 알을 깨고 나오는 문장이 잊히지 않아요.' }
  });
  await prisma.comment.create({
    data: { discussionId: d2.id, userId: reader.id, text: '저는 글을 쓰는 조에게 가장 공감했어요!' }
  });

  console.log('Seed 완료: user=reader / password=password (책벌레 bookworm/password)');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
