import Home from './pages/Home';
import About from './pages/About';
import FAQ from './pages/FAQ';
import BookingForm from './pages/BookingForm';
import ClientDashboard from './pages/ClientDashboard';
import ClientHistory from './pages/ClientHistory';
import ClientBooking from './pages/ClientBooking';
import ClientProfile from './pages/ClientProfile';
import CleanerJobs from './pages/CleanerJobs';
import CleanerSchedule from './pages/CleanerSchedule';
import CleanerReport from './pages/CleanerReport';
import CleanerProfile from './pages/CleanerProfile';
import AdminDashboard from './pages/AdminDashboard';

import AdminCleaners from './pages/AdminCleaners';
import AdminDispatch from './pages/AdminDispatch';
import AdminClients from './pages/AdminClients';


export const PAGES = {
    "Home": Home,
    "About": About,
    "FAQ": FAQ,
    "BookingForm": BookingForm,
    "ClientDashboard": ClientDashboard,
    "ClientHistory": ClientHistory,
    "ClientBooking": ClientBooking,
    "ClientProfile": ClientProfile,
    "CleanerJobs": CleanerJobs,
    "CleanerSchedule": CleanerSchedule,
    "CleanerReport": CleanerReport,
    "CleanerProfile": CleanerProfile,
    "AdminDashboard": AdminDashboard,

    "AdminCleaners": AdminCleaners,
    "AdminDispatch": AdminDispatch,
    "AdminClients": AdminClients,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};