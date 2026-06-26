import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, roles }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  if (!token || !user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;

  return children;
}

export default PrivateRoute;
