import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./components/theme-provider";
import Dashboard from "./pages/Dashboard";
import Feedback from "./pages/Feedback";
import Tags from "./pages/Tags";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import { AppLayout } from "./components/layout/AppLayout";

// A simple wrapper to check if the user is logged in
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          {/* Public Route: Login/Register */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/feedback" element={<Feedback />} />

          {/* Protected Routes wrapped in AppLayout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tags" element={<Tags />} />
          </Route>

          {/* Root Route: Landing Page or Dashboard */}
          <Route path="/" element={
            localStorage.getItem("token") ? <Navigate to="/dashboard" replace /> : <LandingPage />
          } />

          {/* 404 handling */}
          <Route path="*" element={<div className="flex items-center justify-center h-screen font-mono opacity-50 uppercase tracking-widest text-xs">404 | Page Not Found</div>} />
        </Routes>

        {/* Apple-style minimalist notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontFamily: 'inherit'
            },
          }}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;