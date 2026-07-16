import { Link } from 'react-router-dom';

// 이용 약관 (정적 페이지). 서비스 성격에 맞춘 기본 약관 — 필요 시 문구를 보강한다.
const TermsPage = () => {
  return (
    <section className="doc-page">
      <div className="page-head">
        <h1>이용 약관</h1>
        <p className="muted">시행일: 2026-07-17</p>
      </div>

      <h2 className="section-title">제1조 (목적)</h2>
      <p>
        본 약관은 ‘책갈피’(이하 “서비스”)가 제공하는 독서 기록·서평·토론 기능의 이용 조건과 절차,
        이용자와 서비스의 권리·의무를 정하는 것을 목적으로 합니다.
      </p>

      <h2 className="section-title">제2조 (계정)</h2>
      <p>
        이용자는 정확한 정보로 계정을 만들어야 하며, 계정 보안에 대한 책임은 이용자 본인에게 있습니다.
        하나의 이메일로는 하나의 계정만 생성할 수 있습니다.
      </p>

      <h2 className="section-title">제3조 (게시물과 이용자의 의무)</h2>
      <p>
        이용자가 작성한 서평·토론·댓글 등 게시물의 권리와 책임은 작성자에게 있습니다.
        다음 행위는 금지되며, 위반 시 게시물 삭제 및 활동 정지·계정 삭제 등의 조치가 이루어질 수 있습니다.
      </p>
      <ul className="doc-list">
        <li>타인을 비방·모욕하거나 혐오·차별을 조장하는 내용</li>
        <li>음란물, 불법 정보, 타인의 저작권·개인정보를 침해하는 내용</li>
        <li>스팸·광고, 서비스 운영을 방해하는 행위</li>
      </ul>

      <h2 className="section-title">제4조 (운영과 관리)</h2>
      <p>
        관리자는 신고된 게시물을 검토하고, 약관을 위반한 게시물이나 이용자에 대해
        게시물 삭제, 활동 정지, 계정 삭제 등의 조치를 할 수 있습니다.
      </p>

      <h2 className="section-title">제5조 (면책)</h2>
      <p>
        서비스는 무료로 제공되며, 이용자 간에 발생한 분쟁이나 게시물로 인한 손해에 대해
        관련 법령이 허용하는 범위에서 책임을 지지 않습니다. 도서 정보는 외부 API에서 제공받아
        정확성이 보장되지 않을 수 있습니다.
      </p>

      <h2 className="section-title">제6조 (약관의 변경)</h2>
      <p>본 약관은 필요에 따라 변경될 수 있으며, 변경 시 서비스 내에 공지합니다.</p>

      <p className="muted" style={{ marginTop: 24 }}>
        문의: <a href="mailto:ic59673515@gmail.com">ic59673515@gmail.com</a> · <Link to="/">홈으로</Link>
      </p>
    </section>
  );
};

export default TermsPage;
