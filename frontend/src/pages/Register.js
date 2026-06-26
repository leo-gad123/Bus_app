import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'passenger' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authAPI.register(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="login-page">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6 col-xl-5">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Register</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-control" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="passenger">Passenger</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-100">Register</button>
            </form>
            <p className="text-center mt-3">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Register;
