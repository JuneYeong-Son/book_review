import {
  findAllNotices,
  findNoticeById,
  insertNotice,
  updateNoticeById,
  deleteNoticeById
} from '../repository/notice_repository.ts';

const MIN_TITLE = 2;
const MIN_BODY = 5;

export const listNotices = () => findAllNotices();

export const createNotice = async (input: { title: string; body: string; pinned: boolean }) => {
  const title = (input.title ?? '').trim();
  const body = (input.body ?? '').trim();
  if (title.length < MIN_TITLE) return { error: '제목을 2자 이상 입력하세요.' as const };
  if (body.length < MIN_BODY) return { error: '내용을 5자 이상 입력하세요.' as const };
  const notice = await insertNotice({ title, body, pinned: Boolean(input.pinned) });
  return { notice };
};

export const updateNotice = async (id: string, input: { title?: string; body?: string; pinned?: boolean }) => {
  const existing = await findNoticeById(id);
  if (!existing) return { error: '공지를 찾을 수 없습니다.' as const };

  const data: { title?: string; body?: string; pinned?: boolean } = {};
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < MIN_TITLE) return { error: '제목을 2자 이상 입력하세요.' as const };
    data.title = title;
  }
  if (input.body !== undefined) {
    const body = input.body.trim();
    if (body.length < MIN_BODY) return { error: '내용을 5자 이상 입력하세요.' as const };
    data.body = body;
  }
  if (input.pinned !== undefined) data.pinned = Boolean(input.pinned);

  const notice = await updateNoticeById(id, data);
  return { notice };
};

export const removeNotice = async (id: string) => {
  const existing = await findNoticeById(id);
  if (!existing) return { error: '공지를 찾을 수 없습니다.' as const };
  await deleteNoticeById(id);
  return { ok: true as const };
};
