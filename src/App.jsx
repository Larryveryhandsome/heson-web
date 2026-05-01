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
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from './pages/Login';
import { GoogleOAuthProvider } from '@react-oauth/google';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated, appPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if app is public
  const isAppPublic = appPublicSettings?.public_settings?.is_public === true;

  // Handle authentication errors
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

  // App is accessible to all visitors; login is only required for member-specific actions

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
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

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
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
    </GoogleOAuthProvider>
  )
}

export default App