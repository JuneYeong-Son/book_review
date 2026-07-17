import { Link } from 'react-router-dom';

// 개인정보 처리방침 (정적 페이지). Google Play/스토어 제출·Data Safety용 공개 URL.
const PrivacyPage = () => {
  return (
    <section className="doc-page">
      <div className="page-head">
        <h1>개인정보 처리방침</h1>
        <p className="muted">시행일: 2026-07-17</p>
      </div>

      <p>
        ‘책갈피’(이하 “서비스”)는 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다. 본 방침은 서비스가 어떤
        정보를 왜 수집하고 어떻게 관리하는지 설명합니다.
      </p>

      <h2 className="section-title">1. 수집하는 항목</h2>
      <ul className="doc-list">
        <li>
          <strong>회원가입 시(필수):</strong> 아이디, 이메일, 이름, 닉네임, 휴대폰 번호, 비밀번호(암호화 저장)
        </li>
        <li>
          <strong>선택:</strong> 출생연도(연령대 추천), 프로필 아바타(이모지)
        </li>
        <li>
          <strong>소셜 로그인 시:</strong> 제공자(카카오·구글)로부터 받은 식별자, (동의 시) 이메일·닉네임
        </li>
        <li>
          <strong>이용 과정에서 생성:</strong> 서평·토론·댓글·별점 등 이용자가 작성한 콘텐츠, 접속 일시(마지막 접속)
        </li>
        <li>
          <strong>피드백:</strong> 이용자가 남긴 의견·버그 신고 내용
        </li>
      </ul>

      <h2 className="section-title">2. 이용 목적</h2>
      <ul className="doc-list">
        <li>회원 식별·인증(로그인), 계정 보안 및 이메일 인증</li>
        <li>독서 기록·서평·토론 등 서비스 기능 제공, 도서 추천</li>
        <li>문의·피드백 대응, 운영·부정 이용 방지</li>
      </ul>

      <h2 className="section-title">3. 보유 및 파기</h2>
      <p>
        개인정보는 회원 탈퇴 시 지체 없이 파기합니다. 이용자는 언제든지 서비스 내
        <Link to="/settings" className="user-link">
          {' '}
          설정 &gt; 회원 탈퇴
        </Link>
        로 계정과 관련 데이터를 삭제할 수 있습니다. 관련 법령에 따라 일정 기간 보관이 필요한 경우 그 기간 동안 안전하게
        보관 후 파기합니다.
      </p>

      <h2 className="section-title">4. 제3자 제공 및 처리 위탁</h2>
      <p>서비스는 개인정보를 외부에 판매하지 않으며, 서비스 제공을 위해 다음 업체의 인프라·API를 이용합니다.</p>
      <ul className="doc-list">
        <li>
          <strong>Render</strong> — 서버·데이터베이스 호스팅
        </li>
        <li>
          <strong>Resend</strong> — 이메일 인증 메일 발송(이메일 주소)
        </li>
        <li>
          <strong>Kakao / Google</strong> — 소셜 로그인(이용자가 선택 시)
        </li>
        <li>
          <strong>알라딘 OpenAPI</strong> — 도서 정보 조회(개인정보 미전송)
        </li>
      </ul>

      <h2 className="section-title">5. 이용자의 권리</h2>
      <p>
        이용자는 자신의 개인정보를 열람·수정(설정 &gt; 내 정보 수정)하거나 삭제(회원 탈퇴)할 수 있으며, 처리에 대한
        문의를 아래 연락처로 요청할 수 있습니다.
      </p>

      <h2 className="section-title">6. 안전성 확보</h2>
      <p>
        비밀번호는 복호화 불가능한 방식(bcrypt)으로 저장하고, 통신은 HTTPS로 암호화합니다. 세션·토큰은 서명하여 위조를
        방지합니다.
      </p>

      <h2 className="section-title">7. 아동의 개인정보</h2>
      <p>본 서비스는 만 14세 미만 아동을 주 대상으로 하지 않습니다.</p>

      <h2 className="section-title">8. 방침 변경</h2>
      <p>본 방침은 변경될 수 있으며, 변경 시 서비스 내 공지합니다.</p>

      <p className="muted" style={{ marginTop: 24 }}>
        개인정보 문의: <a href="mailto:ic59673515@gmail.com">ic59673515@gmail.com</a> ·{' '}
        <Link to="/terms">이용 약관</Link> · <Link to="/">홈으로</Link>
      </p>
    </section>
  );
};

export default PrivacyPage;
