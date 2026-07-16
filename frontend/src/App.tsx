import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth_context.tsx';
import NavBar from './component/nav_bar.tsx';
import AppFooter from './component/app_footer.tsx';

// 라우트별 코드 분할: 첫 로드 번들을 줄이고 페이지는 진입 시 지연 로드
const HomePage = lazy(() => import('./page/home_page.tsx'));
const LoginPage = lazy(() => import('./page/login_page.tsx'));
const RegisterPage = lazy(() => import('./page/register_page.tsx'));
const RecordsPage = lazy(() => import('./page/records_page.tsx'));
const DiscussionListPage = lazy(() => import('./page/discussion_list_page.tsx'));
const DiscussionDetailPage = lazy(() => import('./page/discussion_detail_page.tsx'));
const MyPage = lazy(() => import('./page/my_page.tsx'));
const MyBookPage = lazy(() => import('./page/my_book_page.tsx'));
const SettingsPage = lazy(() => import('./page/settings_page.tsx'));
const ReviewDetailPage = lazy(() => import('./page/review_detail_page.tsx'));
const BookReviewsPage = lazy(() => import('./page/book_reviews_page.tsx'));
const AdminPage = lazy(() => import('./page/admin_page.tsx'));
const UserProfilePage = lazy(() => import('./page/user_profile_page.tsx'));

const App = () => {
  const { loading } = useAuth();
  if (loading) return <div className="loading">불러오는 중…</div>;

  return (
    <>
      <NavBar />
      <main className="container">
        <Suspense fallback={<div className="loading">불러오는 중…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/discussions" element={<DiscussionListPage />} />
            <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/book/:bookId" element={<MyBookPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/books/:bookId/reviews/:seq" element={<ReviewDetailPage />} />
            <Route path="/books/:bookId" element={<BookReviewsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <AppFooter />
    </>
  );
};

export default App;
