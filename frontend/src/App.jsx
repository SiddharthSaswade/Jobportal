import { Route, Routes } from 'react-router-dom';
import GuestRoute from './components/GuestRoute.jsx';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ROLES } from './constants.js';
import ApplicantsPage from './pages/ApplicantsPage.jsx';
import HomePage from './pages/HomePage.jsx';
import JobDetailPage from './pages/JobDetailPage.jsx';
import JobFormPage from './pages/JobFormPage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MyApplicationsPage from './pages/MyApplicationsPage.jsx';
import MyJobsPage from './pages/MyJobsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RecommendedJobsPage from './pages/RecommendedJobsPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ResumePage from './pages/ResumePage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />

        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={[ROLES.CANDIDATE]} />}>
          <Route path="applications/mine" element={<MyApplicationsPage />} />
          <Route path="jobs/recommended" element={<RecommendedJobsPage />} />
          <Route path="resume" element={<ResumePage />} />
        </Route>

        <Route element={<ProtectedRoute roles={[ROLES.RECRUITER]} />}>
          <Route path="jobs/mine" element={<MyJobsPage />} />
          <Route path="jobs/new" element={<JobFormPage />} />
          <Route path="jobs/:id/edit" element={<JobFormPage />} />
          <Route path="jobs/:id/applicants" element={<ApplicantsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
