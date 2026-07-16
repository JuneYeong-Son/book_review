import { useMemo, useState } from 'react';
import type { Progress } from '@/shared/api/types.ts';

type Props = {
  records: Progress[];
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 그날 무슨 책을 얼마나 읽었는지 간략히 보여주는 달력
const ReadingCalendar = ({ records }: Props) => {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month: 0-11
  });

  // 날짜(YYYY-M-D) → 그날의 기록들
  const byDay = useMemo(() => {
    const map = new Map<string, Progress[]>();
    for (const r of records) {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [records]);

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const move = (delta: number) => {
    setCursor((c) => {
      const m = c.month + delta;
      if (m < 0) return { year: c.year - 1, month: 11 };
      if (m > 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: m };
    });
  };

  const today = new Date();

  return (
    <div className="calendar">
      <div className="cal-head">
        <button className="btn ghost small" onClick={() => move(-1)} aria-label="이전 달">← 이전</button>
        <strong aria-live="polite">{cursor.year}년 {cursor.month + 1}월</strong>
        <button className="btn ghost small" onClick={() => move(1)} aria-label="다음 달">다음 →</button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e${idx}`} className="cal-cell empty" />;
          const key = `${cursor.year}-${cursor.month}-${day}`;
          const dayRecords = byDay.get(key) ?? [];
          const isToday =
            today.getFullYear() === cursor.year &&
            today.getMonth() === cursor.month &&
            today.getDate() === day;
          return (
            <div key={key} className={`cal-cell ${isToday ? 'today' : ''}`}>
              <span className="cal-date">{day}</span>
              <div className="cal-records">
                {dayRecords.slice(0, 3).map((r) => (
                  <span key={r.id} className="cal-record" title={`${r.book.title} ${r.startPage}~${r.endPage}쪽`}>
                    {r.book.title} <em>{r.endPage - r.startPage}p</em>
                  </span>
                ))}
                {dayRecords.length > 3 && <span className="cal-more">+{dayRecords.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReadingCalendar;
