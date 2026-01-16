import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import { VoiceProvider } from './context/VoiceContext';
import { VoiceButlerProvider } from './context/VoiceButlerContext';
import PremiumLayout from './components/PremiumLayout';
import VoiceNavigation from './components/VoiceNavigation';
import NamasteGateway from './pages/NamasteGateway';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ScanPrescription from './pages/ScanPrescription';
import PrescriptionView from './pages/PrescriptionView';
import ReminderList from './pages/ReminderList';
import ReminderAlert from './pages/ReminderAlert';


function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* NamasteGateway route disabled - keeping file for potential future use */}
        {/* <Route path="/namaste" element={<NamasteGateway />} /> */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scan" element={<ScanPrescription />} />
        <Route path="/prescription/:id" element={<PrescriptionView />} />
        <Route path="/reminders" element={<ReminderList />} />
        <Route path="/reminder" element={<Navigate to="/reminders" replace />} />
        <Route path="/reminder/alert/:id" element={<ReminderAlert />} />
        <Route path="/reminder/alert" element={<ReminderAlert />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {

  return (
    <AppProvider>
      <VoiceProvider>
        <VoiceButlerProvider>
          <Router>
            <PremiumLayout>
              <VoiceNavigation>
                <AnimatedRoutes />
              </VoiceNavigation>
            </PremiumLayout>
          </Router>
        </VoiceButlerProvider>
      </VoiceProvider>
    </AppProvider>
  );
}

export default App;
