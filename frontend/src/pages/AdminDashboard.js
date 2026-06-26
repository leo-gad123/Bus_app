import React, { useState, useEffect } from 'react';
import { busAPI, routeAPI, userAPI, ticketAPI } from '../services/api';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [routeForm, setRouteForm] = useState({ name: '', startLocation: '', endLocation: '', baseFare: '' });
  const [busForm, setBusForm] = useState({ plateNumber: '', busNumber: '', capacity: '', driver: '', route: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAll();
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
    { key: 'routes', label: 'Routes' },
    { key: 'buses', label: 'Buses' },
    { key: 'users', label: 'Users' },
    { key: 'tickets', label: 'Tickets' },
  ];

  return (
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
                <div className="data-table" style={{ '--table-cols': '1.2fr 1fr 1fr 0.6fr 0.6fr' }}>
                  <div className="data-table-header">
                    <span>Name</span>
                    <span>From</span>
                    <span>To</span>
                    <span>Fare</span>
                    <span>Action</span>
                  </div>
                  {routes.map(r => (
                    <div className="data-row" key={r._id}>
                      <div className="data-cell" style={{ fontWeight: 600 }}>{r.name}</div>
                      <div className="data-cell">{r.startLocation}</div>
                      <div className="data-cell">{r.endLocation}</div>
                      <div className="data-cell" style={{ fontWeight: 600, color: 'var(--green-primary)' }}>${r.baseFare}</div>
                      <div className="data-cell">
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
                <div className="data-table" style={{ '--table-cols': '0.7fr 1fr 0.7fr 1fr 1fr 0.6fr' }}>
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
                      <div className="data-cell" style={{ fontWeight: 600 }}>{b.busNumber}</div>
                      <div className="data-cell">{b.plateNumber}</div>
                      <div className="data-cell">{b.capacity}</div>
                      <div className="data-cell">{b.driver?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</div>
                      <div className="data-cell">{b.route?.name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</div>
                      <div className="data-cell">
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
        <div className="card">
          <div className="card-body">
            <h5>Users</h5>
            <div className="data-table" style={{ '--table-cols': '1fr 1.2fr 1fr 0.7fr 0.7fr 0.5fr' }}>
              <div className="data-table-header">
                <span>Name</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Role</span>
                <span>Balance</span>
                <span>Active</span>
              </div>
              {users.map(u => (
                <div className="data-row" key={u._id}>
                  <div className="data-cell" style={{ fontWeight: 600 }}>{u.name}</div>
                  <div className="data-cell" style={{ color: 'var(--text-secondary)' }}>{u.email}</div>
                  <div className="data-cell">{u.phone}</div>
                  <div className="data-cell">
                    <span className="badge badge-role">{u.role}</span>
                  </div>
                  <div className="data-cell" style={{ fontWeight: 600 }}>${u.walletBalance}</div>
                  <div className="data-cell">
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: '0.82rem', fontWeight: 500,
                      color: u.isActive ? 'var(--green-primary)' : 'var(--text-muted)'
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: u.isActive ? 'var(--green-primary)' : 'var(--text-muted)',
                        display: 'inline-block'
                      }} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="data-empty">No users yet</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="card">
          <div className="card-body">
            <h5>All Tickets</h5>
            <div className="data-table" style={{ '--table-cols': '1fr 1.2fr 0.6fr 0.7fr 1fr 0.5fr' }}>
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
                  <div className="data-cell" style={{ fontWeight: 600 }}>{t.user?.name || 'N/A'}</div>
                  <div className="data-cell">{t.route?.name || 'N/A'}</div>
                  <div className="data-cell" style={{ fontWeight: 600, color: 'var(--green-primary)' }}>${t.fare}</div>
                  <div className="data-cell">
                    <span className={`badge bg-${t.status === 'active' ? 'success' : t.status === 'used' ? 'secondary' : 'danger'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="data-cell" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {new Date(t.createdAt).toLocaleString()}
                  </div>
                  <div className="data-cell">
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
  );
}

export default AdminDashboard;
