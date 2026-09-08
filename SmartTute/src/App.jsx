import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { applyBrandingTheme } from './config/branding.js';
import { isSetupCompleted } from './services/storage.js';
import { Setup } from './pages/Setup.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Tutes } from './pages/Tutes.jsx';
import { TuteEditor } from './pages/TuteEditor.jsx';
import { TutePreview } from './pages/TutePreview.jsx';
import { Playgrounds } from './pages/Playgrounds.jsx';
import { CreatePlayground } from './pages/CreatePlayground.jsx';
import { TeacherPlayground } from './pages/TeacherPlayground.jsx';
import { JoinPlayground } from './pages/JoinPlayground.jsx';
import 'katex/dist/katex.min.css';

import './styles/globals.css';

/**
 * Guard for routes requiring completed setup (/dashboard, /tutes).
 * Redirects to /setup if initial onboarding is incomplete.
 */
function ProtectedRoute({ children }) {
  if (!isSetupCompleted()) {
    return <Navigate to="/setup" replace />;
  }
  return children;
}

/**
 * Guard for setup route (/setup).
 * Redirects to /dashboard if setup is already completed.
 */
function SetupRoute({ children }) {
  if (isSetupCompleted()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function App() {
  useEffect(() => {
    // Apply dynamic branding theme CSS variables to :root on launch
    applyBrandingTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/setup"
          element={
            <SetupRoute>
              <Setup />
            </SetupRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutes"
          element={
            <ProtectedRoute>
              <Tutes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutes/new"
          element={
            <ProtectedRoute>
              <TuteEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutes/:id/edit"
          element={
            <ProtectedRoute>
              <TuteEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutes/:id/preview"
          element={
            <ProtectedRoute>
              <TutePreview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/playgrounds"
          element={
            <ProtectedRoute>
              <Playgrounds />
            </ProtectedRoute>
          }
        />
        <Route
          path="/playgrounds/new"
          element={
            <ProtectedRoute>
              <CreatePlayground />
            </ProtectedRoute>
          }
        />
        <Route
          path="/playgrounds/:id"
          element={
            <ProtectedRoute>
              <TeacherPlayground />
            </ProtectedRoute>
          }
        />
        <Route
          path="/playgrounds/join/:code"
          element={<JoinPlayground />}
        />

        {/* Wildcard redirect based on setup status */}
        <Route
          path="*"
          element={<Navigate to={isSetupCompleted() ? "/dashboard" : "/setup"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
