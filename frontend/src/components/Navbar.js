import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setExpanded(false);
    navigate('/login');
  };

  const closeNav = () => setExpanded(false);

  if (!token) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={closeNav}>E-modoka</Link>
        <button className="navbar-toggler" type="button" onClick={() => setExpanded(!expanded)}
          aria-controls="navbarNav" aria-expanded={expanded} aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {user?.role === 'passenger' && (
              <li className="nav-item"><Link className="nav-link" to="/dashboard" onClick={closeNav}>Dashboard</Link></li>
            )}
            {user?.role === 'driver' && (
              <li className="nav-item"><Link className="nav-link" to="/scanner" onClick={closeNav}>Scanner</Link></li>
            )}
            {user?.role === 'admin' && (
              <li className="nav-item"><Link className="nav-link" to="/admin" onClick={closeNav}>Admin</Link></li>
            )}
            <li className="nav-item"><Link className="nav-link" to="/profile" onClick={closeNav}>Profile</Link></li>
            <li className="nav-item d-flex align-items-center">
              {user?.avatar ? (
                <img src={user.avatar.startsWith('/uploads') ? `http://localhost:5000${user.avatar}` : user.avatar} alt="" className="navbar-avatar me-1" />
              ) : (
                <span className="navbar-avatar-placeholder me-1">
                  {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                </span>
              )}
              <span className="nav-link">
                {user?.name} ({user?.role})
              </span>
            </li>
            <li className="nav-item d-flex align-items-center">
              <button className="btn btn-sm theme-toggle me-2" onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                {theme === 'light' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                )}
              </button>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-primary btn-sm mt-1" onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
