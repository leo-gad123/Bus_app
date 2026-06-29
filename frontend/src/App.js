import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import PassengerDashboard from './pages/PassengerDashboard';
import ScannerPage from './pages/ScannerPage';
import AdminDashboard from './pages/AdminDashboard';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-bus">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="28" width="48" height="24" rx="4" fill="#16A34A" opacity="0.9"/>
            <rect x="12" y="20" width="40" height="10" rx="2" fill="#22C55E" opacity="0.7"/>
            <rect x="28" y="24" width="8" height="6" rx="1" fill="#16A34A"/>
            <circle cx="18" cy="54" r="5" fill="#1C1C1A"/>
            <circle cx="46" cy="54" r="5" fill="#1C1C1A"/>
            <rect x="20" y="31" width="6" height="6" rx="1" fill="#BBF7D0"/>
            <rect x="30" y="31" width="6" height="6" rx="1" fill="#BBF7D0"/>
            <rect x="40" y="31" width="6" height="6" rx="1" fill="#BBF7D0"/>
          </svg>
        </div>
          <img src="/logo.png" alt="Logo" height="48" style={{ borderRadius: 10, marginBottom: 16 }} />
          <h1 className="loading-title">E-modoka</h1>
        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <HelmetProvider>
      <Router>
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute roles={['passenger']}>
                <PassengerDashboard />
              </PrivateRoute>
            } />
            <Route path="/scanner" element={
              <PrivateRoute roles={['driver']}>
                <ScannerPage />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute roles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
