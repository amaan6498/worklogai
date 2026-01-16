import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./components/theme-provider";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";

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
      <div className="min-h-screen bg-white dark:bg-zinc-950 selection:bg-primary/30">
        <Routes>
          {/* Public Route: Login/Register */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected Route: Main App */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect base URL to dashboard or auth */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
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
      </div>
    </Router>
    </ThemeProvider>
  );
}

export default App;