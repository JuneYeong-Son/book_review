import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/lib/auth_context.tsx';
import NavBar from '@/widgets/nav_bar.tsx';
import AppFooter from '@/widgets/app_footer.tsx';

// 라우트별 코드 분할: 첫 로드 번들을 줄이고 페이지는 진입 시 지연 로드
const HomePage = lazy(() => import('@/pages/home_page.tsx'));
const LoginPage = lazy(() => import('@/pages/login_page.tsx'));
const RegisterPage = lazy(() => import('@/pages/register_page.tsx'));
const RecordsPage = lazy(() => import('@/pages/records_page.tsx'));
const DiscussionListPage = lazy(() => import('@/pages/discussion_list_page.tsx'));
const DiscussionDetailPage = lazy(() => import('@/pages/discussion_detail_page.tsx'));
const MyPage = lazy(() => import('@/pages/my_page.tsx'));
const MyBookPage = lazy(() => import('@/pages/my_book_page.tsx'));
const SettingsPage = lazy(() => import('@/pages/settings_page.tsx'));
const ReviewDetailPage = lazy(() => import('@/pages/review_detail_page.tsx'));
const BookReviewsPage = lazy(() => import('@/pages/book_reviews_page.tsx'));
const AdminPage = lazy(() => import('@/pages/admin_page.tsx'));
const UserProfilePage = lazy(() => import('@/pages/user_profile_page.tsx'));

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
