import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatLayout from './pages/ChatLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('authToken');
        setIsAuthenticated(false);
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Validate stored user object
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (!u || !u.id) {
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      } catch (err) {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }

    const token = localStorage.getItem('authToken');
    if (token) verifyToken(token);
    else setLoading(false);
    const timeout = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-2xl font-bold text-gray-800">Loading...</div></div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/channels/*" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ChatLayout setIsAuthenticated={setIsAuthenticated} /></ProtectedRoute>} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/channels" replace /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/channels" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
