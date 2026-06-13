import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Chat } from './pages/Chat';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthLayout } from './components/AuthLayout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import './App.css';

function AppContent() {
  const location = useLocation();
  // Don't show Navbar in Chat, Login, Register, or root views to support clean full-height auth/chat layouts
  const hideNavbarPaths = ['/', '/login', '/register', '/chat'];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      <main className="main-content">
        <Routes>
          {/* Guest Only Routes */}
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Route>

          {/* Protected Chat Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<Chat />} />
          </Route>
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <ThemeToggle />
      </Router>
    </AuthProvider>
  );
}

export default App;
