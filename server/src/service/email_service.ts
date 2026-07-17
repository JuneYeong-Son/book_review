// 이메일 발송 (Resend HTTP API). SDK 없이 fetch로 호출.
// RESEND_API_KEY가 없으면(로컬/미설정) 실제 발송 대신 콘솔에 코드를 남기고 dev 모드로 동작한다.
// 배포 시 Render 환경변수에 RESEND_API_KEY(, RESEND_FROM)를 넣으면 실제 메일이 나간다.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export const sendVerificationEmail = async (to: string, code: string): Promise<{ dev: boolean }> => {
  const apiKey = process.env.RESEND_API_KEY;
  // 발신 주소: 도메인 인증 전에는 Resend 테스트 주소를 쓸 수 있다.
  const from = process.env.RESEND_FROM ?? '책갈피 <onboarding@resend.dev>';

  if (!apiKey) {
    // 프로덕션에서 키가 없으면 인증 코드를 노출하지 않고 실패시킨다(우회 방지).
    if (process.env.NODE_ENV === 'production') {
      throw new Error('이메일 발송이 설정되지 않았습니다. (RESEND_API_KEY 미설정)');
    }
    // 로컬/개발에서만 콘솔에 코드를 남겨 테스트 가능하게 한다.
    console.log(`[DEV] 이메일 인증 코드 (${to}): ${code}`);
    return { dev: true };
  }

  const html = `
    <div style="font-family:sans-serif;line-height:1.6">
      <h2>책갈피 이메일 인증</h2>
      <p>아래 인증 코드를 회원가입 화면에 입력해주세요. (10분간 유효)</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
      <p style="color:#888">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
    </div>`;

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject: '[책갈피] 이메일 인증 코드', html })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('Resend 발송 실패:', res.status, detail);
    throw new Error('인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
  return { dev: false };
};
