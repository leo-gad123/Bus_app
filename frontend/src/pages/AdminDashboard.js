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
                <table className="table">
                  <thead><tr><th>Name</th><th>From</th><th>To</th><th>Fare</th><th>Action</th></tr></thead>
                  <tbody>
                    {routes.map(r => (
                      <tr key={r._id}>
                        <td>{r.name}</td>
                        <td>{r.startLocation}</td>
                        <td>{r.endLocation}</td>
                        <td>${r.baseFare}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteRoute(r._id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <table className="table">
                  <thead><tr><th>Bus #</th><th>Plate</th><th>Capacity</th><th>Driver</th><th>Route</th><th>Action</th></tr></thead>
                  <tbody>
                    {buses.map(b => (
                      <tr key={b._id}>
                        <td>{b.busNumber}</td>
                        <td>{b.plateNumber}</td>
                        <td>{b.capacity}</td>
                        <td>{b.driver?.name || 'Unassigned'}</td>
                        <td>{b.route?.name || 'Unassigned'}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => handleDeleteBus(b._id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-body">
            <h5>Users</h5>
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Balance</th><th>Active</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td><span className="badge bg-info">{u.role}</span></td>
                    <td>${u.walletBalance}</td>
                    <td>{u.isActive ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="card">
          <div className="card-body">
            <h5>All Tickets</h5>
            <table className="table">
              <thead><tr><th>Passenger</th><th>Route</th><th>Fare</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id}>
                    <td>{t.user?.name || 'N/A'}</td>
                    <td>{t.route?.name || 'N/A'}</td>
                    <td>${t.fare}</td>
                    <td><span className={`badge bg-${t.status === 'active' ? 'success' : t.status === 'used' ? 'secondary' : 'danger'}`}>{t.status}</span></td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
