import { useState } from 'react';
import { apiPost } from '@/shared/api/client.ts';
import { useAuth } from '@/shared/lib/auth_context.tsx';

type Props = {
  targetType: 'review' | 'discussion' | 'user';
  targetId: string;
  label?: string;
};

const ReportButton = ({ targetType, targetId, label }: Props) => {
  const { user } = useAuth();
  const [done, setDone] = useState(false);

  if (!user) return null;

  const handleReport = async () => {
    const reason = window.prompt('신고 사유를 입력하세요 (선택)');
    if (reason === null) return; // 취소
    try {
      await apiPost('/reports', { targetType, targetId, reason });
      setDone(true);
    } catch {
      /* noop */
    }
  };

  return (
    <button className="report-btn" onClick={handleReport} disabled={done} title="신고">
      {done ? '신고됨' : (label ?? '🚩 신고')}
    </button>
  );
};

export default ReportButton;
