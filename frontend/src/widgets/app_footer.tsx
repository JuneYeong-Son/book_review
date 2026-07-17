import { Link } from 'react-router-dom';
import FeedbackWidget from '@/widgets/feedback_widget.tsx';

const AppFooter = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <span className="footer-brand">📖 책갈피</span>
        <div className="footer-actions">
          <FeedbackWidget />
          <Link to="/notices" className="footer-link">
            공지사항
          </Link>
          <Link to="/terms" className="footer-link">
            이용 약관
          </Link>
          <Link to="/privacy" className="footer-link">
            개인정보 처리방침
          </Link>
        </div>
        <div className="footer-info">
          <span>JuneYeongSon</span>
          <a href="mailto:ic59673515@gmail.com">ic59673515@gmail.com</a>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
