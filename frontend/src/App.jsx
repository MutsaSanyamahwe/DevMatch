import { UserProvider } from './context/UserContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AppShell from './pages/AppShell';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MatchesPage from './pages/MatchesPage';
import DiscoverPage from './pages/DiscoverPage';
import ViewProfilePage from './pages/ViewProfilePage';
import MessagesPage from './pages/MessagesPage';
import ExplorePage from './pages/ExplorePage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ViewDeveloper from './pages/ViewDeveloper';



function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />




          {/* Protected routes with AppShell */}
          <Route element={<AppShell />}>
            
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/viewProfile/:userid" element={<ViewProfilePage />} />
            <Route path="/viewDeveloper/:userid" element={<ViewDeveloper />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:match_id" element={<MessagesPage />} />
            <Route path="/explore" element={<ExplorePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  )
}

export default App;