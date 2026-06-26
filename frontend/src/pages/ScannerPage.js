import React, { useState, useEffect } from 'react';
import { ticketAPI, busAPI } from '../services/api';

function ScannerPage() {
  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [activeTrip, setActiveTrip] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBuses();
    loadActiveTrip();
  }, []);

  const loadBuses = async () => {
    try {
      const { data } = await busAPI.getAll();
      setBuses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadActiveTrip = async () => {
    try {
      const { data } = await ticketAPI.activeTrips();
      if (data.length > 0) setActiveTrip(data[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTrip = async () => {
    if (!selectedBus) return;
    try {
      const { data } = await ticketAPI.startTrip(selectedBus);
      setActiveTrip(data);
      setMessage('Trip started!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to start trip');
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    try {
      await ticketAPI.endTrip(activeTrip._id);
      setActiveTrip(null);
      setMessage('Trip ended');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to end trip');
    }
  };

  const handleVerify = async () => {
    if (!qrInput.trim()) return;
    try {
      const { data } = await ticketAPI.verify(qrInput, selectedBus || undefined);
      setResult(data);
      setMessage(data.valid ? 'Ticket verified!' : 'Invalid ticket');
    } catch (err) {
      setResult({ valid: false, error: err.response?.data?.error || 'Verification failed' });
      setMessage('Verification error');
    }
  };

  return (
    <div>
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-body">
              <h5>Trip Management</h5>
              {activeTrip ? (
                <div>
                  <p className="text-success">Active Trip: {activeTrip.route?.name}</p>
                  <p>Passengers: {activeTrip.passengerCount} | Revenue: ${activeTrip.revenue}</p>
                  <button className="btn btn-danger" onClick={handleEndTrip}>End Trip</button>
                </div>
              ) : (
                <div className="d-flex gap-2">
                  <select className="form-select" value={selectedBus}
                    onChange={(e) => setSelectedBus(e.target.value)}>
                    <option value="">Select Bus</option>
                    {buses.filter(b => b.driver?._id === JSON.parse(localStorage.getItem('user') || '{}')._id)
                      .map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.busNumber} - {b.plateNumber}
                        </option>
                      ))}
                  </select>
                  <button className="btn btn-success" onClick={handleStartTrip}
                    disabled={!selectedBus}>Start Trip</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {message && <div className={`alert ${result?.valid ? 'alert-success' : 'alert-info'}`}>{message}</div>}

      <div className="row mb-4">
        <div className="col-md-8 mx-auto">
          <div className="card">
            <div className="card-body">
              <h5>Scan QR Ticket</h5>
              <p className="text-muted">Paste QR code data or scan from camera</p>
              <div className="mb-3">
                <textarea className="form-control" rows="3"
                  placeholder="Paste QR data here..."
                  value={qrInput} onChange={(e) => setQrInput(e.target.value)} />
              </div>
              <button className="btn btn-primary w-100" onClick={handleVerify}
                disabled={!qrInput.trim()}>Verify Ticket</button>

              {result && (
                <div className={`mt-3 p-3 rounded ${result.valid ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                  <h5>{result.valid ? 'VALID TICKET' : 'INVALID TICKET'}</h5>
                  {result.valid ? (
                    <div>
                      <p>Passenger: {result.ticket?.passengerName}</p>
                      <p>Fare: ${result.ticket?.fare}</p>
                      <p>Used at: {new Date(result.ticket?.usedAt).toLocaleTimeString()}</p>
                    </div>
                  ) : (
                    <p>{result.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScannerPage;
