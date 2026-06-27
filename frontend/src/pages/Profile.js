import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Profile() {
  const navigate = useNavigate();
  const stored = JSON.parse(localStorage.getItem('user') || '{}');

  const [name, setName] = useState(stored.name || '');
  const [phone, setPhone] = useState(stored.phone || '');
  const [avatar, setAvatar] = useState(stored.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      let avatarUrl = avatar;
      if (avatarFile) {
        const { data } = await authAPI.uploadAvatar(avatarFile);
        avatarUrl = data.avatar;
      }
      const { data } = await authAPI.updateProfile({ name, phone, avatar: avatarUrl });
      localStorage.setItem('user', JSON.stringify(data));
      setAvatar(avatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setMessage('Profile updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      const { data } = await authAPI.changePassword({ currentPassword, newPassword });
      setMessage(data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  const fileRef = React.useRef(null);

  const handleAvatarClick = () => {
    fileRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const initials = stored.name
    ? stored.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6 col-xl-5">
        <div className="card">
          <div className="card-body">
            <h3 className="card-title text-center mb-4">My Profile</h3>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="text-center mb-4">
              <div className="profile-avatar" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="profile-avatar-img" />
                ) : avatar ? (
                  <img src={avatar.startsWith('/uploads') ? `http://localhost:5000${avatar}` : avatar} alt="avatar" className="profile-avatar-img" />
                ) : (
                  <div className="profile-avatar-initials">{initials}</div>
                )}
                <div className="profile-avatar-overlay">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <input type="file" ref={fileRef} onChange={handleAvatarChange} accept="image/jpeg,image/png,image/gif,image/webp" hidden />
              <div className="mt-2">
                <span className="badge badge-role">{stored.role}</span>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate}>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" value={stored.email || ''} disabled />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            <hr className="my-4" />

            <h5 className="mb-3">Change Password</h5>
            <form onSubmit={handlePasswordChange}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-outline-primary w-100">Update Password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
