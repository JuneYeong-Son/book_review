import { useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { apiPost } from '@/shared/api/client.ts';
import Modal from '@/shared/ui/modal.tsx';

type Kind = 'feedback' | 'bug';

// 푸터의 "의견·버그 신고" 버튼 + 제출 모달. 로그인 없이도 보낼 수 있다.
const FeedbackWidget = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('feedback');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setOpen(false);
    setError('');
    setDone(false);
    setMessage('');
    setKind('feedback');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiPost('/feedback', { kind, message, page: location.pathname });
      setDone(true);
      setMessage('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="btn ghost small" onClick={() => setOpen(true)}>
        💬 의견·버그 신고
      </button>

      {open && (
        <Modal title="의견·버그 신고" onClose={close}>
          {done ? (
            <div className="feedback-done">
              <p>소중한 의견 감사합니다! 더 나은 서비스를 위해 참고할게요.</p>
              <button type="button" className="btn full" onClick={close}>닫기</button>
            </div>
          ) : (
            <form className="modal-form" onSubmit={submit}>
              <fieldset className="feedback-kind">
                <legend className="picker-label">유형</legend>
                <label className="radio-row">
                  <input type="radio" name="kind" checked={kind === 'feedback'} onChange={() => setKind('feedback')} />
                  의견·건의
                </label>
                <label className="radio-row">
                  <input type="radio" name="kind" checked={kind === 'bug'} onChange={() => setKind('bug')} />
                  버그 신고
                </label>
              </fieldset>
              <label>내용
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  minLength={5}
                  placeholder="불편한 점이나 버그를 자세히 알려주세요. (5자 이상)"
                />
              </label>
              {error && <p className="error" role="alert">{error}</p>}
              <button type="submit" className="btn full" disabled={submitting}>
                {submitting ? '보내는 중…' : '보내기'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
};

export default FeedbackWidget;
