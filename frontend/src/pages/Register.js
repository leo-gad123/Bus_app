import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import SEO from '../components/SEO';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'passenger' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const { data } = await authAPI.register(form);
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <>
      <SEO title="Register" description="Create a new E-modoka account to start booking bus tickets and tracking your trips in Kigali, Rwanda." path="/register" />
      <div className="login-page">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6 col-xl-5">
          <div className="card">
            <div className="card-body">
              <h3 className="card-title text-center mb-4">Register</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            {success ? (
              <div>
                <div className="alert alert-success" style={{ textAlign: 'center', fontSize: '0.95rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📧</div>
                  {success}
                </div>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Didn't get the email? <Link to="/login" style={{ fontWeight: 600 }}>Try logging in</Link> to resend.
                </p>
              </div>
            ) : (
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
            )}
            <p className="text-center mt-3">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}

export default Register;
