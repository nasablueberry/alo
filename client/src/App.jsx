import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import DashboardShell from './components/DashboardShell';
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterProvider from './pages/RegisterProvider';
import StudentDashboard from './pages/StudentDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import Homepage from './pages/Homepage';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminStudentForm from './pages/admin/AdminStudentForm';
import AdminProviders from './pages/admin/AdminProviders';
import AdminProviderDetail from './pages/admin/AdminProviderDetail';
import ProgramsList from './pages/ProgramsList';
import MyApplications from './pages/MyApplications';
import MyProfile from './pages/MyProfile';
import ProviderProfile from './pages/ProviderProfile';
import ProviderCreateProgram from './pages/ProviderCreateProgram';
import ApplyProgram from './pages/ApplyProgram';
import ProviderProgramApplications from './pages/ProviderProgramApplications';
import ProviderReviewApplications from './pages/ProviderReviewApplications';
import AdminDisburse from './pages/admin/AdminDisburse';
import HelpCenter from './pages/HelpCenter';
import ProviderRejections from './pages/ProviderRejections';
import AdminRejections from './pages/admin/AdminRejections';
import AdminFraudReview from './pages/admin/AdminFraudReview';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  const role = user.role?.toLowerCase?.() || user.role;
  if (allowedRoles?.length && !allowedRoles.map((r) => r?.toLowerCase()).includes(role)) return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'provider' ? '/provider' : '/student'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Homepage />} />
        <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="register/student" element={<PublicRoute><RegisterStudent /></PublicRoute>} />
        <Route path="register/provider" element={<PublicRoute><RegisterProvider /></PublicRoute>} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell role="student" />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="programs" element={<ProgramsList />} />
        <Route path="programs/:programId/apply" element={<ApplyProgram />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="help" element={<HelpCenter />} />
      </Route>

      <Route
        path="/provider"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <DashboardShell role="provider" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProviderDashboard />} />
        <Route path="review" element={<ProviderReviewApplications />} />
        <Route path="programs/new" element={<ProviderCreateProgram />} />
        <Route path="programs/:programId/applications" element={<ProviderProgramApplications />} />
        <Route path="profile" element={<ProviderProfile />} />
        <Route path="rejections" element={<ProviderRejections />} />
        <Route path="help" element={<HelpCenter />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardShell role="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="students/new" element={<AdminStudentForm />} />
        <Route path="students/:id" element={<AdminStudentForm />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="providers/:id" element={<AdminProviderDetail />} />
        <Route path="providers" element={<AdminProviders />} />
        <Route path="disburse" element={<AdminDisburse />} />
        <Route path="rejections" element={<AdminRejections />} />
        <Route path="fraud" element={<AdminFraudReview />} />
        <Route path="help" element={<HelpCenter />} />
      </Route>
    </Routes>
  );
}
