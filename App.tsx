import React, { useState } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { LanguageProvider } from './hooks/useLanguage.tsx';
import { AuthProvider } from './hooks/useAuth.tsx';
import { UIProvider, useUI } from './hooks/useUI.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { FearOfFlyingPage } from './pages/FearOfFlyingPage.tsx';
import { CafftProgramPage } from './pages/CafftProgramPage.tsx';
import { UserGuidePage } from './pages/UserGuidePage.tsx';
import { HelpVideosPage } from './pages/HelpVideosPage.tsx';
import { CafftIntroPage } from './pages/CafftIntroPage.tsx';
import { QpviiPage } from './pages/QpviiPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.tsx';
import { EvolutionPage } from './pages/EvolutionPage.tsx';
import { ExposurePage } from './pages/ExposurePage.tsx';
import { ExposureHierarchyPage } from './pages/ExposureHierarchyPage.tsx'; 
import { ScientificFoundationPage } from './pages/ScientificFoundationPage.tsx';
import { HelpButton } from './components/HelpButton.tsx'; 
import { AssistantModal } from './components/AssistantModal.tsx';   
import { ExposureExplanationPage } from './pages/ExposureExplanationPage.tsx';
import { CelebrationPage } from './pages/CelebrationPage.tsx';
import { ReviewSelectionPage } from './pages/ReviewSelectionPage.tsx';
import { LastSessionPage } from './pages/LastSessionPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { FeedbackPage } from './pages/FeedbackPage.tsx';
import { HelpCenterPage } from './pages/HelpCenterPage.tsx';
import { OnboardingProvider, useOnboarding } from './hooks/useOnboarding.tsx';
import { OnboardingTour } from './components/OnboardingTour.tsx';
import { ReminderCheck } from './components/ReminderCheck.tsx';
import { NotificationBanner } from './components/NotificationBanner.tsx';
import { NotificationConsentManager } from './components/NotificationConsentManager.tsx';
import { PatientProgressIndicator } from './components/PatientProgressIndicator.tsx';

// Therapist Imports
import { TherapistLayout } from './components/therapist/TherapistLayout.tsx';
import { TherapistDashboardPage } from './pages/therapist/TherapistDashboardPage.tsx';
import { TherapistPatientsPage } from './pages/therapist/TherapistPatientsPage.tsx';
import { TherapistNotificationsPage } from './pages/therapist/TherapistNotificationsPage.tsx';
import { PatientDetailPage } from './pages/therapist/PatientDetailPage.tsx';

// Manager & Superadmin Imports
import { SuperadminDashboardPage } from './pages/superadmin/SuperadminDashboardPage.tsx';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage.tsx';

// Dev Imports
import { DevToolsPage } from './pages/dev/DevToolsPage.tsx';


const MainLayout: React.FC = () => {
  const { isAssistantOpen, toggleAssistant } = useUI();
  const { startTour, hasCompletedTour } = useOnboarding();

  const handleNotificationConsentHandled = () => {
    // Start onboarding tour for patients after they handle the notification consent modal
    // We use a small delay to allow the modal to close visually before the tour starts
    setTimeout(() => {
      if (!hasCompletedTour) {
        startTour('patient');
      }
    }, 300);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
      <Navbar />
      <PatientProgressIndicator />
      <NotificationBanner />
      <NotificationConsentManager onConsentHandled={handleNotificationConsentHandled} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <HelpButton onClick={toggleAssistant} />
      <AssistantModal isOpen={isAssistantOpen} onClose={toggleAssistant} />
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <UIProvider>
          <ReminderCheck />
          <OnboardingProvider>
            <HashRouter>
              <OnboardingTour />
              <Routes>
              {/* Main Patient and Public Layout */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                {/* Public Routes */}
                <Route path="fear-of-flying" element={<FearOfFlyingPage />} />
                <Route path="cafft-program" element={<CafftProgramPage />} />
                <Route path="user-guide" element={<UserGuidePage />} />
                <Route path="help-videos" element={<HelpVideosPage />} />
                <Route path="scientific-foundation" element={<ScientificFoundationPage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="help-center" element={<HelpCenterPage />} />

                {/* Auth Routes */}
                <Route path="register" element={<RegisterPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password/:token" element={<ResetPasswordPage />} />
                
                {/* Patient-only Routes */}
                <Route path="qpvii-evaluation" element={<QpviiPage />} />

                <Route path="cafft-intro" element={
                    <ProtectedRoute role="patient"><CafftIntroPage /></ProtectedRoute>
                }/>
                <Route path="profile" element={
                    <ProtectedRoute role="patient"><ProfilePage /></ProtectedRoute>
                }/>
                <Route path="evolution" element={
                    <ProtectedRoute role="patient"><EvolutionPage /></ProtectedRoute>
                }/>
                <Route path="exposure-hierarchy" element={
                    <ProtectedRoute role="patient"><ExposureHierarchyPage /></ProtectedRoute>
                }/>
                 <Route path="exposure-explanation" element={
                    <ProtectedRoute role="patient"><ExposureExplanationPage /></ProtectedRoute>
                }/>
                <Route path="exposure" element={
                    <ProtectedRoute role="patient"><ExposurePage /></ProtectedRoute>
                }/>
                <Route path="review-selection" element={
                    <ProtectedRoute role="patient"><ReviewSelectionPage /></ProtectedRoute>
                }/>
                 <Route path="last-session" element={
                    <ProtectedRoute role="patient"><LastSessionPage /></ProtectedRoute>
                }/>
                <Route path="celebration" element={
                    <ProtectedRoute role="patient"><CelebrationPage /></ProtectedRoute>
                }/>
              </Route>

              {/* Therapist Layout & Routes */}
              <Route path="/therapist" element={<ProtectedRoute role="therapist"><TherapistLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<TherapistDashboardPage />} />
                <Route path="patients" element={<TherapistPatientsPage />} />
                <Route path="notifications" element={<TherapistNotificationsPage />} />
                <Route path="patient/:patientId" element={<PatientDetailPage />} />
              </Route>

              {/* Manager Routes */}
              <Route path="/manager" element={<ProtectedRoute role="manager"><TherapistLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<ManagerDashboardPage />} />
                <Route path="patients" element={<TherapistPatientsPage />} /> {/* Managers can view patients too */}
                <Route path="patient/:patientId" element={<PatientDetailPage />} />
              </Route>

              {/* Superadmin Routes */}
              <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><TherapistLayout /></ProtectedRoute>}>
                <Route path="dashboard" element={<SuperadminDashboardPage />} />
              </Route>

              {/* Developer Tools Route */}
              <Route path="/dev/tools" element={<DevToolsPage />} />

              {/* Fallback Route */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </HashRouter>
          </OnboardingProvider>
        </UIProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;