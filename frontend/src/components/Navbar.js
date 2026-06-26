import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
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
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={closeNav}>Smart E-Bus</Link>
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
            <li className="nav-item">
              <span className="nav-link text-light">
                {user?.name} ({user?.role})
              </span>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-light btn-sm mt-1" onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
