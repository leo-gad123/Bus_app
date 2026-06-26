import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">Smart E-Bus</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {user?.role === 'passenger' && (
              <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
            )}
            {user?.role === 'driver' && (
              <li className="nav-item"><Link className="nav-link" to="/scanner">Scanner</Link></li>
            )}
            {user?.role === 'admin' && (
              <li className="nav-item"><Link className="nav-link" to="/admin">Admin</Link></li>
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
