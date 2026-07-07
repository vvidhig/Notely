import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Component, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useReminders } from "./hooks/useReminders";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import TasksPage from "./pages/TasksPage";
import SessionsPage from "./pages/SessionsPage";
import HighlightsPage from "./pages/HighlightsPage";
import SchedulePage from "./pages/SchedulePage";
import SessionPage from "./pages/SessionPage";
import SummaryPage from "./pages/SummaryPage";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null };

  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#ECCCA6] flex items-center justify-center p-8">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-['Yeseva_One'] text-2xl font-bold text-red-500 mb-2">Something went wrong</h2>
            <pre className="text-red-400 text-xs whitespace-pre-wrap break-words mb-4">
              {this.state.error}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = "/dashboard"; }}
              className="bg-[#47748B] hover:bg-[#27456C] text-white px-4 py-2 rounded-full text-sm font-bold"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#ECCCA6]" />;
  return token ? <>{children}</> : <Navigate to="/" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#ECCCA6]" />;
  return !token ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  useReminders(); // register notification scheduler for the session
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><HomePage /></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
      <Route path="/sessions" element={<PrivateRoute><SessionsPage /></PrivateRoute>} />
      <Route path="/highlights" element={<PrivateRoute><HighlightsPage /></PrivateRoute>} />
      <Route path="/schedule" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
      <Route path="/session/:id" element={<PrivateRoute><SessionPage /></PrivateRoute>} />
      <Route path="/session/:id/summary" element={<PrivateRoute><SummaryPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
