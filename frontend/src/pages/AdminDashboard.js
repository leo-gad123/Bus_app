import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { busAPI, routeAPI, userAPI, ticketAPI, getAvatarUrl } from '../services/api';
import SEO from '../components/SEO';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [stats, setStats] = useState(null);
  const [routeForm, setRouteForm] = useState({ name: '', startLocation: '', endLocation: '', baseFare: '' });
  const [busForm, setBusForm] = useState({ plateNumber: '', busNumber: '', capacity: '', driver: '', route: '' });
  const [message, setMessage] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const { data } = await userAPI.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAll = async () => {
    try {
      const [r, b, u, t] = await Promise.all([
        routeAPI.getAllAdmin(),
        busAPI.getAll(),
        userAPI.getAll(),
        ticketAPI.getAll()
      ]);
      setRoutes(r.data);
      setBuses(b.data);
      setUsers(u.data);
      setTickets(t.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
    loadStats();
  }, [loadStats]);

  const handleAddRoute = async (e) => {
    e.preventDefault();
    try {
      await routeAPI.create({ ...routeForm, baseFare: parseFloat(routeForm.baseFare) });
      setMessage('Route added');
      setRouteForm({ name: '', startLocation: '', endLocation: '', baseFare: '' });
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteRoute = async (id) => {
    try {
      await routeAPI.delete(id);
      setMessage('Route deleted');
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    }
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    try {
      await busAPI.create({ ...busForm, capacity: parseInt(busForm.capacity), driver: busForm.driver || undefined, route: busForm.route || undefined });
      setMessage('Bus added');
      setBusForm({ plateNumber: '', busNumber: '', capacity: '', driver: '', route: '' });
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteTicket = async (id) => {
    try {
      await ticketAPI.adminDelete(id);
      setMessage('Ticket deleted');
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to delete ticket');
    }
  };

  const handleToggleActive = async (id, current) => {
    try {
      await userAPI.update(id, { isActive: !current });
      setMessage(`User ${current ? 'deactivated' : 'activated'}`);
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This will also delete all their tickets.`)) return;
    try {
      await userAPI.delete(id);
      setMessage('User deleted');
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleDeleteBus = async (id) => {
    try {
      await busAPI.delete(id);
      setMessage('Bus deleted');
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed');
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'routes', label: 'Routes' },
    { key: 'buses', label: 'Buses' },
    { key: 'users', label: 'Users' },
    { key: 'tickets', label: 'Tickets' },
  ];

  return (
    <>
      <SEO title="Admin Dashboard" description="Manage users, routes, buses, and tickets on E-modoka. Admin control panel for bus operations." path="/admin" />
      <div>
      <h3>Admin Dashboard</h3>
      {message && <div className="alert alert-info">{message}</div>}

      <ul className="nav nav-tabs mb-3">
        {tabs.map(t => (
          <li className="nav-item" key={t.key}>
            <button className={`nav-link ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}>{t.label}</button>
          </li>
        ))}
      </ul>

      {activeTab === 'overview' && stats && (
        <div>
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-lg-3">
              <div className="card stat-card">
                <div className="card-body">
                  <div className="stat-icon" style={{ background: 'var(--green-subtle)', color: 'var(--green-primary)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="stat-value">{stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                  <div className="stat-subs">
                    {stats.usersByRole?.passenger || 0} passengers &middot; {stats.usersByRole?.driver || 0} drivers &middot; {stats.usersByRole?.admin || 0} admins
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-3">
              <div className="card stat-card">
                <div className="card-body">
                  <div className="stat-icon" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                  </div>
                  <div className="stat-value">{stats.totalBuses}</div>
                  <div className="stat-label">Buses</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-3">
              <div className="card stat-card">
                <div className="card-body">
                  <div className="stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div className="stat-value">{stats.totalRoutes}</div>
                  <div className="stat-label">Routes</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-3">
              <div className="card stat-card">
                <div className="card-body">
                  <div className="stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <div className="stat-value">{stats.totalTickets}</div>
                  <div className="stat-label">Tickets</div>
                  <div className="stat-subs">
                    {stats.ticketsByStatus?.active || 0} active &middot; {stats.ticketsByStatus?.used || 0} used &middot; {stats.ticketsByStatus?.expired || 0} expired
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-3">
              <div className="card stat-card">
                <div className="card-body">
                  <div className="stat-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  </div>
                  <div className="stat-value">{stats.totalTrips}</div>
                  <div className="stat-label">Total Trips</div>
                  <div className="stat-subs">{stats.activeTrips || 0} active now</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-3">
              <div className="card stat-card">
                <div className="card-body">
                  <div className="stat-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div className="stat-value">RWF {(stats.revenue || 0).toFixed(2)}</div>
                  <div className="stat-label">Total Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'overview' && !stats && (
        <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>Loading stats...</div>
      )}
      {activeTab === 'routes' && (
        <div className="row">
          <div className="col-md-5">
            <div className="card">
              <div className="card-body">
                <h5>Add Route</h5>
                <form onSubmit={handleAddRoute}>
                  <div className="mb-2">
                    <input className="form-control" placeholder="Route Name" value={routeForm.name}
                      onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} required />
                  </div>
                  <div className="mb-2">
                    <input className="form-control" placeholder="Start Location" value={routeForm.startLocation}
                      onChange={(e) => setRouteForm({ ...routeForm, startLocation: e.target.value })} required />
                  </div>
                  <div className="mb-2">
                    <input className="form-control" placeholder="End Location" value={routeForm.endLocation}
                      onChange={(e) => setRouteForm({ ...routeForm, endLocation: e.target.value })} required />
                  </div>
                  <div className="mb-2">
                    <input className="form-control" type="number" placeholder="Base Fare" value={routeForm.baseFare}
                      onChange={(e) => setRouteForm({ ...routeForm, baseFare: e.target.value })} required />
                  </div>
                  <button className="btn btn-primary w-100" type="submit">Add Route</button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-7">
            <div className="card">
              <div className="card-body">
                <h5>Routes</h5>
                <div className="data-table" style={{ '--table-cols': '1.2fr 1.2fr 1.2fr 0.7fr 0.7fr' }}>
                  <div className="data-table-header">
                    <span>Name</span>
                    <span>From</span>
                    <span>To</span>
                    <span>Fare</span>
                    <span>Action</span>
                  </div>
                  {routes.map(r => (
                    <div className="data-row" key={r._id}>
                      <div className="data-cell" data-label="Name" style={{ fontWeight: 600 }}>{r.name}</div>
                      <div className="data-cell" data-label="From">{r.startLocation}</div>
                      <div className="data-cell" data-label="To">{r.endLocation}</div>
                      <div className="data-cell" data-label="Fare" style={{ fontWeight: 600, color: 'var(--green-primary)' }}>RWF {r.baseFare}</div>
                      <div className="data-cell" data-label="">
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRoute(r._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  {routes.length === 0 && <div className="data-empty">No routes yet</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'buses' && (
        <div className="row">
          <div className="col-md-5">
            <div className="card">
              <div className="card-body">
                <h5>Add Bus</h5>
                <form onSubmit={handleAddBus}>
                  <div className="mb-2">
                    <input className="form-control" placeholder="Plate Number" value={busForm.plateNumber}
                      onChange={(e) => setBusForm({ ...busForm, plateNumber: e.target.value })} required />
                  </div>
                  <div className="mb-2">
                    <input className="form-control" placeholder="Bus Number" value={busForm.busNumber}
                      onChange={(e) => setBusForm({ ...busForm, busNumber: e.target.value })} required />
                  </div>
                  <div className="mb-2">
                    <input className="form-control" type="number" placeholder="Capacity" value={busForm.capacity}
                      onChange={(e) => setBusForm({ ...busForm, capacity: e.target.value })} required />
                  </div>
                  <div className="mb-2">
                    <select className="form-select" value={busForm.driver}
                      onChange={(e) => setBusForm({ ...busForm, driver: e.target.value })}>
                      <option value="">Select Driver</option>
                      {users.filter(u => u.role === 'driver').map((u) => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <select className="form-select" value={busForm.route}
                      onChange={(e) => setBusForm({ ...busForm, route: e.target.value })}>
                      <option value="">Select Route</option>
                      {routes.map((r) => (
                        <option key={r._id} value={r._id}>{r.name} ({r.startLocation} → {r.endLocation})</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-primary w-100" type="submit">Add Bus</button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-7">
            <div className="card">
              <div className="card-body">
                <h5>Buses</h5>
                <div className="data-table" style={{ '--table-cols': '0.7fr 1fr 0.7fr 1.2fr 1.2fr 0.6fr' }}>
                  <div className="data-table-header">
                    <span>Bus #</span>
                    <span>Plate</span>
                    <span>Capacity</span>
                    <span>Driver</span>
                    <span>Route</span>
                    <span>Action</span>
                  </div>
                  {buses.map(b => (
                    <div className="data-row" key={b._id}>
                      <div className="data-cell" data-label="Bus #" style={{ fontWeight: 600 }}>{b.busNumber}</div>
                      <div className="data-cell" data-label="Plate">{b.plateNumber}</div>
                      <div className="data-cell" data-label="Capacity">{b.capacity}</div>
                      <div className="data-cell" data-label="Driver">{b.driver?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</div>
                      <div className="data-cell" data-label="Route">{b.route?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</div>
                      <div className="data-cell" data-label="">
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBus(b._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  {buses.length === 0 && <div className="data-empty">No buses yet</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <UsersSection users={users} onToggleActive={handleToggleActive} onDeleteUser={handleDeleteUser} />
      )}

      {activeTab === 'tickets' && (
        <div className="card">
          <div className="card-body">
            <h5>All Tickets</h5>
                <div className="data-table" style={{ '--table-cols': '1fr 1.2fr 0.6fr 0.7fr 1.2fr 0.5fr' }}>
                  <div className="data-table-header">
                    <span>Passenger</span>
                    <span>Route</span>
                    <span>Fare</span>
                    <span>Status</span>
                    <span>Date</span>
                    <span>Action</span>
                  </div>
                  {tickets.map(t => (
                    <div className="data-row" key={t._id}>
                      <div className="data-cell" data-label="Passenger" style={{ fontWeight: 600 }}>{t.user?.name || 'N/A'}</div>
                      <div className="data-cell" data-label="Route">{t.route?.name || 'N/A'}</div>
                      <div className="data-cell" data-label="Fare" style={{ fontWeight: 600, color: 'var(--green-primary)' }}>RWF {t.fare}</div>
                      <div className="data-cell" data-label="Status">
                        <span className={`badge bg-${t.status === 'active' ? 'success' : t.status === 'used' ? 'secondary' : 'danger'}`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="data-cell" data-label="Date" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                      <div className="data-cell" data-label="">
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTicket(t._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                  {tickets.length === 0 && <div className="data-empty">No tickets yet</div>}
                </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function UsersSection({ users, onToggleActive, onDeleteUser }) {
  const [search, setSearch] = useState('');
  const [avatarErrors, setAvatarErrors] = useState({});
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  return (
    <div className="card">
      <div className="card-body">
        <div className="admin-users-header">
          <h5>Users</h5>
          <div className="admin-users-search">
            <div className="admin-search-wrap">
              <input
                className="form-control admin-search-input"
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <select className="form-select admin-role-select"
              value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="passenger">Passengers</option>
              <option value="driver">Drivers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
        <div className="data-table" style={{ '--table-cols': '1fr 1.2fr 1fr 0.7fr 0.7fr 0.7fr 0.6fr' }}>
          <div className="data-table-header">
            <span>Name</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Role</span>
            <span>Balance</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {filtered.map(u => (
            <div className="data-row" key={u._id}>
              <div className="data-cell" data-label="Name" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                {u.avatar && !avatarErrors[u._id] ? (
                  <img src={getAvatarUrl(u.avatar)} alt="" className="admin-user-avatar" onError={() => setAvatarErrors(p => ({ ...p, [u._id]: true }))} />
                ) : (
                  <span className="admin-user-avatar-placeholder">{u.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}</span>
                )}
                {u.name}
              </div>
              <div className="data-cell" data-label="Email" style={{ color: 'var(--text-secondary)' }}>{u.email}</div>
              <div className="data-cell" data-label="Phone">{u.phone}</div>
              <div className="data-cell" data-label="Role">
                <span className="badge badge-role">{u.role}</span>
              </div>
              <div className="data-cell" data-label="Balance" style={{ fontWeight: 600 }}>RWF {u.walletBalance}</div>
              <div className="data-cell" data-label="Status">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="status-dot" style={{ color: u.isActive ? 'var(--green-primary)' : 'var(--text-muted)' }}>
                    <span className={`status-indicator ${u.isActive ? 'active' : ''}`} />
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    className={`btn btn-sm ${u.isActive ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                    onClick={() => onToggleActive(u._id, u.isActive)}
                    title={u.isActive ? 'Deactivate user' : 'Activate user'}
                    style={{ padding: '2px 10px', fontSize: '0.72rem' }}
                  >
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              <div className="data-cell" data-label="">
                <button className="btn btn-danger btn-sm" onClick={() => onDeleteUser(u._id, u.name)}>Delete</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="data-empty">
              {search || roleFilter !== 'all'
                ? 'No users match your search'
                : 'No users yet'}
            </div>
          )}
        </div>
        <div className="admin-users-count">
          Showing {filtered.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
