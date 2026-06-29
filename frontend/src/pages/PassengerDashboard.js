import React, { useState, useEffect } from 'react';
import { QRCode } from 'react-qr-code';
import { userAPI, routeAPI, ticketAPI } from '../services/api';
import PassengerLiveLocation from '../components/PassengerLiveLocation';

function PassengerDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [balance, setBalance] = useState(user.walletBalance || 0);
  const [routes, setRoutes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryPhone, setBeneficiaryPhone] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [selectedTicketQr, setSelectedTicketQr] = useState(null);
  const [message, setMessage] = useState('');


  const handleCancel = async (ticketId) => {
    try {
      await ticketAPI.cancel(ticketId);
      setMessage('Ticket cancelled');
      loadTickets();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to cancel ticket');
    }
  };

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
      setMessage(`Wallet topped up by FRW ${amount}`);
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
      const { data } = await ticketAPI.purchase(selectedRoute, beneficiaryName, beneficiaryPhone);
      setQrCode(data.qrCode);
      setMessage('Ticket purchased successfully!');
      setBalance(data.updatedBalance ?? balance);
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.walletBalance = data.updatedBalance ?? (stored.walletBalance - (data.ticket?.fare || 0));
      localStorage.setItem('user', JSON.stringify(stored));
      setBeneficiaryName('');
      setBeneficiaryPhone('');
      loadTickets();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Purchase failed');
    }
  };

  const handleDownloadQr = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrCode}`;
    link.download = 'ticket-qr.png';
    link.click();
  };

  return (
    <div>
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-body">
              <h5>Welcome, {user.name}</h5>
              <h3 className="text-success">Balance: FRW {balance.toFixed(2)}</h3>
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
                    {r.name} ({r.startLocation} → {r.endLocation}) - FRW {r.baseFare}
                  </option>
                ))}
              </select>
              <p className="text-muted small mb-1">Book for someone (optional)</p>
              <input type="text" className="form-control mb-1" placeholder="Beneficiary name"
                value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} />
              <input type="tel" className="form-control mb-2" placeholder="Beneficiary phone"
                value={beneficiaryPhone} onChange={(e) => setBeneficiaryPhone(e.target.value)} />
              <button className="btn btn-primary w-100" onClick={handlePurchase}
                disabled={!selectedRoute}>
                Purchase Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <PassengerLiveLocation />
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
                <button className="btn btn-outline-success btn-sm mt-3" onClick={handleDownloadQr}>
                  Save QR Image
                </button>
                <p className="mt-2 text-muted">Show this QR to the bus scanner</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTicketQr && (
        <div className="row mb-4">
          <div className="col-md-6 mx-auto">
            <div className="card text-center">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">Ticket QR - {selectedTicketQr.route?.name || 'N/A'}</h5>
                  <button className="btn-close" onClick={() => setSelectedTicketQr(null)}></button>
                </div>
                <div className="d-flex justify-content-center bg-white p-3">
                  <QRCode value={selectedTicketQr.qrCode} size={256} />
                </div>
                <p className="mt-2 mb-0 text-muted">
                  {selectedTicketQr.route?.startLocation} → {selectedTicketQr.route?.endLocation} | FRW {selectedTicketQr.fare}
                </p>
                {selectedTicketQr.beneficiaryName && (
                  <p className="mb-0 text-muted">For: {selectedTicketQr.beneficiaryName}{selectedTicketQr.beneficiaryPhone ? ` (${selectedTicketQr.beneficiaryPhone})` : ''}</p>
                )}
                <p className="text-muted">Show this QR to the bus scanner</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h5>Ticket History</h5>
          <div className="data-table" style={{ '--table-cols': '1.5fr 0.7fr 0.7fr 1fr 1fr 0.7fr' }}>
            <div className="data-table-header">
              <span>Route</span>
              <span>Fare</span>
              <span>Status</span>
              <span>For</span>
              <span>Date</span>
              <span>Action</span>
            </div>
            {tickets.map((t) => (
              <div className="data-row" key={t._id}>
                <div className="data-cell">{t.route?.name || 'N/A'}</div>
                <div className="data-cell" style={{ fontWeight: 600, color: 'var(--green-primary)' }}>RWF {t.fare}</div>
                <div className="data-cell">
                  <span className={`badge bg-${t.status === 'active' ? 'success' : t.status === 'used' ? 'secondary' : 'danger'}`}>
                    {t.status}
                  </span>
                </div>
                <div className="data-cell">
                  {t.beneficiaryName ? (
                    <span style={{ fontSize: '0.82rem' }}>{t.beneficiaryName}{t.beneficiaryPhone ? ` (${t.beneficiaryPhone})` : ''}</span>
                  ) : (
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>Self</span>
                  )}
                </div>
                <div className="data-cell" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{new Date(t.createdAt).toLocaleString()}</div>
                <div className="data-cell">
                  {t.status === 'active' && (
                    <>
                      <button className="btn btn-outline-primary btn-sm me-1" onClick={() => setSelectedTicketQr(t)}>QR</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t._id)}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {tickets.length === 0 && <div className="data-empty">No tickets yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PassengerDashboard;
