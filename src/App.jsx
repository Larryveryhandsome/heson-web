import React from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import AdminAttendance from './pages/AdminAttendance'
import MyBookings from './pages/MyBookings'
import PaymentResult from './pages/PaymentResult'
import PaymentRedirect from './pages/PaymentRedirect'
import OrderQuery from './pages/OrderQuery'
import ServiceInquiry from './pages/ServiceInquiry'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import JoinCleaner from './pages/JoinCleaner'
import BusinessCooperation from './pages/BusinessCooperation'
import Recruitment from './pages/Recruitment'
import CleanerTeam from './pages/CleanerTeam'
import CleanerApplicationForm from './pages/CleanerApplicationForm'
import CleanerManagement from './pages/CleanerManagement'
import CleanerBulkImport from './pages/CleanerBulkImport'
import ServiceCaseManager from './pages/ServiceCaseManager'
import InternalSpreadsheet from './pages/InternalSpreadsheet'
import AdminAI from './pages/AdminAI'
import PartTimeSchedule from './pages/PartTimeSchedule'
import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom';
const Router = import.meta.env.VITE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from './pages/Login';
import { GoogleOAuthProvider } from '@react-oauth/google';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h1 style={{ color: '#c0392b' }}>載入錯誤</h1>
          <p style={{ color: '#555' }}>網頁發生錯誤，請重新整理或聯絡管理員。</p>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', fontSize: '12px', textAlign: 'left', maxWidth: '600px', margin: '1rem auto', overflow: 'auto' }}>
            {String(this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            重新整理
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated, appPublicSettings } = useAuth();

  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAppPublic = appPublicSettings?.public_settings?.is_public === true;

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'user_banned') {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm">
            <h1 className="text-2xl font-bold text-red-600 mb-4">帳號已被封禁</h1>
            <p className="text-stone-600 mb-6">您的帳號因違反平台規定已被停用，無法訪問此平台。</p>
            <p className="text-xs text-stone-400">如有疑問，請聯繫客服支援。</p>
          </div>
        </div>
      );
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper>} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route key={path} path={`/${path}`} element={<LayoutWrapper currentPageName={path}><Page /></LayoutWrapper>} />
      ))}
      <Route path="/AdminAttendance" element={<LayoutWrapper currentPageName="AdminAttendance"><AdminAttendance /></LayoutWrapper>} />
      <Route path="/MyBookings" element={<LayoutWrapper currentPageName="MyBookings"><MyBookings /></LayoutWrapper>} />
      <Route path="/PaymentResult" element={<LayoutWrapper currentPageName="PaymentResult"><PaymentResult /></LayoutWrapper>} />
      <Route path="/PaymentRedirect" element={<LayoutWrapper currentPageName="PaymentRedirect"><PaymentRedirect /></LayoutWrapper>} />
      <Route path="/ServiceInquiry" element={<LayoutWrapper currentPageName="ServiceInquiry"><ServiceInquiry /></LayoutWrapper>} />
      <Route path="/OrderQuery" element={<LayoutWrapper currentPageName="OrderQuery"><OrderQuery /></LayoutWrapper>} />
      <Route path="/PrivacyPolicy" element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicy /></LayoutWrapper>} />
      <Route path="/TermsOfService" element={<LayoutWrapper currentPageName="TermsOfService"><TermsOfService /></LayoutWrapper>} />
      <Route path="/JoinCleaner" element={<LayoutWrapper currentPageName="JoinCleaner"><JoinCleaner /></LayoutWrapper>} />
      <Route path="/BusinessCooperation" element={<LayoutWrapper currentPageName="BusinessCooperation"><BusinessCooperation /></LayoutWrapper>} />
      <Route path="/Recruitment" element={<LayoutWrapper currentPageName="Recruitment"><Recruitment /></LayoutWrapper>} />
      <Route path="/CleanerTeam" element={<LayoutWrapper currentPageName="CleanerTeam"><CleanerTeam /></LayoutWrapper>} />
      <Route path="/CleanerApplicationForm" element={<LayoutWrapper currentPageName="CleanerApplicationForm"><CleanerApplicationForm /></LayoutWrapper>} />
      <Route path="/CleanerManagement" element={<LayoutWrapper currentPageName="CleanerManagement"><CleanerManagement /></LayoutWrapper>} />
      <Route path="/CleanerBulkImport" element={<LayoutWrapper currentPageName="CleanerBulkImport"><CleanerBulkImport /></LayoutWrapper>} />
      <Route path="/ServiceCaseManager" element={<LayoutWrapper currentPageName="ServiceCaseManager"><ServiceCaseManager /></LayoutWrapper>} />
      <Route path="/InternalSpreadsheet" element={<InternalSpreadsheet />} />
      <Route path="/AdminAI" element={<LayoutWrapper currentPageName="AdminAI"><AdminAI /></LayoutWrapper>} />
      <Route path="/PartTimeSchedule" element={<PartTimeSchedule />} />
      <Route path="/Login" element={<Login />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const inner = (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  );

  const wrapped = googleClientId
    ? <GoogleOAuthProvider clientId={googleClientId}>{inner}</GoogleOAuthProvider>
    : inner;

  return <ErrorBoundary>{wrapped}</ErrorBoundary>;
}

export default App
