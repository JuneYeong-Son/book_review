import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth_context.tsx';
import NavBar from './component/nav_bar.tsx';
import HomePage from './page/home_page.tsx';
import LoginPage from './page/login_page.tsx';
import RegisterPage from './page/register_page.tsx';
import RecordsPage from './page/records_page.tsx';
import DiscussionListPage from './page/discussion_list_page.tsx';
import DiscussionDetailPage from './page/discussion_detail_page.tsx';

const App = () => {
  const { loading } = useAuth();
  if (loading) return <div className="loading">불러오는 중...</div>;

  return (
    <>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/discussions" element={<DiscussionListPage />} />
          <Route path="/discussions/:id" element={<DiscussionDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
