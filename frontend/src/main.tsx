import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/app/App.tsx';
import { AuthProvider } from '@/shared/lib/auth_context.tsx';
// 본문·제목 폰트 을유1945(자체 호스팅). 로컬 설치 여부와 무관하게 동일 렌더.
import '@/app/styles/fonts.css';
// 을유1945 로드 전(파일이 커서 잠깐)에 보여줄 폴백 명조 웹폰트.
import '@fontsource/nanum-myeongjo/400.css';
import '@fontsource/nanum-myeongjo/700.css';
import '@/app/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
