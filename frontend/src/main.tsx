import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import App from '@/app/App.tsx';
import { AuthProvider } from '@/shared/lib/auth_context.tsx';
import { swrFetcher } from '@/shared/api/client.ts';
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
        {/* SWR 전역 설정: 공용 fetcher + 포커스 재검증/에러 재시도 끄고, 5s 내 동일 요청은 dedup */}
        <SWRConfig
          value={{ fetcher: swrFetcher, revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 5000 }}
        >
          <App />
        </SWRConfig>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
