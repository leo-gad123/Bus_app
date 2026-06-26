import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qr-code';
import { userAPI, routeAPI, ticketAPI } from '../services/api';

function PassengerDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [balance, setBalance] = useState(user.walletBalance || 0);
  const [routes, setRoutes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRoutes();
    loadTickets();
  }, []);

  const loadRoutes = async () => {
    try {
      const { data } = await routeAPI.getAll();
      setRoutes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTickets = async () => {
    try {
      const { data } = await ticketAPI.my();
      setTickets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTopup = async () => {
    try {
      const amount = parseFloat(topupAmount);
      if (isNaN(amount) || amount <= 0) return;
      const { data } = await userAPI.topup(amount);
      setBalance(data.balance);
      setTopupAmount('');
      setMessage(`Wallet topped up by $${amount}`);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.walletBalance = data.balance;
      localStorage.setItem('user', JSON.stringify(stored));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Topup failed');
    }
  };

  const handlePurchase = async () => {
    if (!selectedRoute) return;
    try {
      const { data } = await ticketAPI.purchase(selectedRoute);
      setQrCode(data.qrCode);
      setMessage('Ticket purchased successfully!');
      setBalance(data.updatedBalance ?? balance);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.walletBalance = data.updatedBalance ?? (stored.walletBalance - (data.ticket?.fare || 0));
      localStorage.setItem('user', JSON.stringify(stored));
      loadTickets();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Purchase failed');
    }
  };

  return (
    <div>
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-body">
              <h5>Welcome, {user.name}</h5>
              <h3 className="text-success">Balance: ${balance.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5>Top Up Wallet</h5>
              <div className="input-group">
                <input type="number" className="form-control" placeholder="Amount"
                  value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} />
                <button className="btn btn-success" onClick={handleTopup}>Add</button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5>Purchase Ticket</h5>
              <select className="form-select mb-2" value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}>
                <option value="">Select Route</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.startLocation} → {r.endLocation}) - ${r.baseFare}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary w-100" onClick={handlePurchase}
                disabled={!selectedRoute}>
                Purchase Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {qrCode && (
        <div className="row mb-4">
          <div className="col-md-6 mx-auto">
            <div className="card text-center">
              <div className="card-body">
                <h5>Your QR Ticket</h5>
                <div className="d-flex justify-content-center bg-white p-3">
                  <QRCode value={qrCode} size={256} />
                </div>
                <p className="mt-2 text-muted">Show this QR to the bus scanner</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h5>Ticket History</h5>
          <table className="table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Fare</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.route?.name || 'N/A'}</td>
                  <td>${t.fare}</td>
                  <td>
                    <span className={`badge bg-${t.status === 'active' ? 'success' : t.status === 'used' ? 'secondary' : 'danger'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan="4" className="text-center">No tickets yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PassengerDashboard;
