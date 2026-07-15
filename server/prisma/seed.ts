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
  await prisma.report.deleteMany();
  await prisma.reviewComment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.recoExclusion.deleteMany();
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

  const soyul = await prisma.user.create({
    data: { username: 'soyul', name: '소설러버', avatar: '🐱', birthYear: 1998, passwordHash: createHash('password') }
  });
  const cheol = await prisma.user.create({
    data: { username: 'cheol', name: '철학도', avatar: '🦉', birthYear: 1990, passwordHash: createHash('password') }
  });
  const essay = await prisma.user.create({
    data: { username: 'essay', name: '에세이러', avatar: '🌱', birthYear: 1985, passwordHash: createHash('password') }
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

  // 서평(독서 기록) — 책별 순번(bookSeq) 부여
  const p_r_b2_1 = await prisma.progress.create({
    data: { userId: reader.id, bookId: 'b2', bookSeq: 1, startPage: 0, endPage: 60,
      note: '싱클레어의 어린 시절이 인상적', quote: '새는 알에서 나오려고 투쟁한다.', rating: 0 }
  });
  const p_r_b2_2 = await prisma.progress.create({
    data: { userId: reader.id, bookId: 'b2', bookSeq: 2, startPage: 60, endPage: 120,
      note: '데미안과의 만남 이후 성장에 몰입', quote: '내 안에서 솟아 나오려는 것, 그것을 나는 살아보려 했다.', rating: 0 }
  });
  const p_bw_b1_1 = await prisma.progress.create({
    data: { userId: bookworm.id, bookId: 'b1', bookSeq: 1, startPage: 0, endPage: 90,
      note: '네 자매의 일상이 따뜻하다', quote: '', rating: 0 }
  });
  const p_sy_b1_2 = await prisma.progress.create({
    data: { userId: soyul.id, bookId: 'b1', bookSeq: 2, startPage: 0, endPage: 150,
      note: '조의 독립적인 모습에 반했다', quote: '나는 폭풍이 두렵지 않아요. 배 다루는 법을 배우고 있으니까요.', rating: 0 }
  });
  const p_sy_b3_1 = await prisma.progress.create({
    data: { userId: soyul.id, bookId: 'b3', bookSeq: 1, startPage: 0, endPage: 100,
      note: '많은 생각을 하게 하는 소설', quote: '', rating: 0 }
  });
  const p_ch_b2_3 = await prisma.progress.create({
    data: { userId: cheol.id, bookId: 'b2', bookSeq: 3, startPage: 0, endPage: 200,
      note: '자아를 찾는 여정으로 읽힌다', quote: '', rating: 0 }
  });
  const p_ch_b4_1 = await prisma.progress.create({
    data: { userId: cheol.id, bookId: 'b4', bookSeq: 1, startPage: 0, endPage: 40,
      note: '어른을 위한 동화', quote: '가장 중요한 것은 눈에 보이지 않아.', rating: 0 }
  });
  const p_es_b4_2 = await prisma.progress.create({
    data: { userId: essay.id, bookId: 'b4', bookSeq: 2, startPage: 0, endPage: 96,
      note: '몇 번을 읽어도 새롭다', quote: '네가 길들인 것에 너는 언제까지나 책임이 있어.', rating: 0 }
  });
  const p_r_b4_3 = await prisma.progress.create({
    data: { userId: reader.id, bookId: 'b4', bookSeq: 3, startPage: 0, endPage: 96,
      note: '사막의 별이 떠오른다', quote: '', rating: 0 }
  });

  // 책 단위 별점 (서평이 아니라 책에 매김)
  await prisma.rating.createMany({
    data: [
      { userId: reader.id, bookId: 'b2', value: 5 },
      { userId: reader.id, bookId: 'b4', value: 4 },
      { userId: bookworm.id, bookId: 'b1', value: 5 },
      { userId: soyul.id, bookId: 'b1', value: 4 },
      { userId: soyul.id, bookId: 'b3', value: 5 },
      { userId: cheol.id, bookId: 'b2', value: 4 },
      { userId: cheol.id, bookId: 'b4', value: 5 },
      { userId: essay.id, bookId: 'b4', value: 4 }
    ]
  });

  // 좋아요 (서평에)
  await prisma.like.createMany({
    data: [
      { userId: bookworm.id, progressId: p_r_b2_1.id },
      { userId: cheol.id, progressId: p_r_b2_2.id },
      { userId: soyul.id, progressId: p_r_b2_1.id },
      { userId: reader.id, progressId: p_sy_b1_2.id },
      { userId: essay.id, progressId: p_ch_b4_1.id },
      { userId: reader.id, progressId: p_es_b4_2.id },
      { userId: cheol.id, progressId: p_es_b4_2.id }
    ]
  });

  // 관심 책
  await prisma.interest.createMany({
    data: [
      { userId: reader.id, bookId: 'b1' },
      { userId: reader.id, bookId: 'b4' },
      { userId: soyul.id, bookId: 'b2' },
      { userId: cheol.id, bookId: 'b1' }
    ]
  });

  // 토론 (토론을 연 사람은 그 책의 기록이 있어야 함)
  const d1 = await prisma.discussion.create({
    data: { bookId: 'b2', ownerId: reader.id, title: '데미안, 알을 깨는 고통에 대하여',
      description: '싱클레어의 성장에서 가장 인상 깊었던 장면을 나눠요.' }
  });
  const d2 = await prisma.discussion.create({
    data: { bookId: 'b1', ownerId: bookworm.id, title: '작은 아씨들 중 최애 캐릭터는?',
      description: '조, 메그, 베스, 에이미 중 누구에게 가장 공감하나요?' }
  });
  const d3 = await prisma.discussion.create({
    data: { bookId: 'b4', ownerId: cheol.id, title: '어린 왕자, 어른이 잃어버린 것',
      description: '어른이 되면서 우리가 잊은 건 무엇일까요?' }
  });

  // 댓글
  await prisma.comment.createMany({
    data: [
      { discussionId: d1.id, userId: bookworm.id, text: '새가 알을 깨고 나오는 문장이 잊히지 않아요.' },
      { discussionId: d1.id, userId: cheol.id, text: '자아 형성의 은유로 읽으면 더 깊어져요.' },
      { discussionId: d2.id, userId: reader.id, text: '저는 글을 쓰는 조에게 가장 공감했어요!' },
      { discussionId: d2.id, userId: soyul.id, text: '베스의 따뜻함도 좋아요 🥺' },
      { discussionId: d3.id, userId: essay.id, text: '길들인다는 것의 의미를 다시 생각했어요.' },
      { discussionId: d3.id, userId: reader.id, text: '눈에 보이지 않는 것의 소중함...' }
    ]
  });

  console.log('Seed 완료 — 계정(비번 공통 password): reader, bookworm, soyul, cheol, essay');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
