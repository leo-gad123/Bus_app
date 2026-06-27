import React, { useState, useEffect, useRef } from 'react';
import { ticketAPI, busAPI } from '../services/api';

function ScannerPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);

  const [result, setResult] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [activeTrip, setActiveTrip] = useState(null);
  const [message, setMessage] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    loadBuses();
    loadActiveTrip();
    return () => stopCamera();
  }, []);

  const loadBuses = async () => {
    try {
      const { data } = await busAPI.getMy();
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  };

  const verifyTicket = async (value) => {
    const code = (value || '').trim();
    if (!code) return;

    try {
      const { data } = await ticketAPI.verify(code, selectedBus || undefined);
      setResult(data);
      setMessage(data.valid ? 'Ticket verified!' : 'Invalid ticket');
    } catch (err) {
      setResult({ valid: false, error: err.response?.data?.error || 'Verification failed' });
      setMessage('Verification error');
    }
  };

  const startCameraScan = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser.');
      return;
    }

    if (cameraOpen && streamRef.current) {
      stopCamera();
      return;
    }

    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (typeof window.BarcodeDetector !== 'undefined') {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      }

      setCameraOpen(true);
      setMessage('Camera ready. Point it at the ticket QR code.');
      scanFrame();
    } catch (err) {
      setCameraError('Unable to access the camera. Please allow camera permission and try again.');
      console.error(err);
    }
  };

  const scanFrame = async () => {
    if (!cameraOpen || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (detectorRef.current && !scanningRef.current) {
        try {
          const barcodes = await detectorRef.current.detect(canvas);
          if (barcodes.length > 0) {
            const scannedValue = barcodes[0].rawValue;
            if (scannedValue) {
              scanningRef.current = true;
              await verifyTicket(scannedValue);
              setTimeout(() => {
                scanningRef.current = false;
              }, 2500);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (cameraOpen) {
      requestAnimationFrame(scanFrame);
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
              {buses.map((b) => (
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
              <p className="text-muted">Point the camera at the passenger ticket QR code</p>

              <div className="d-flex gap-2 mb-3">
                <button className="btn btn-outline-primary" onClick={startCameraScan}>
                  {cameraOpen ? 'Close Camera' : 'Open Camera'}
                </button>
                <button className="btn btn-outline-secondary" onClick={() => {
                  setResult(null);
                  setMessage('');
                  setCameraError('');
                }}>Clear</button>
              </div>

              {cameraError && <div className="alert alert-warning">{cameraError}</div>}

              {cameraOpen && (
                <div className="mb-3">
                  <video ref={videoRef} className="w-100 rounded border" playsInline muted autoPlay />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <p className="text-muted small mt-2">Camera is running. Hold the ticket QR in front of the camera.</p>
                </div>
              )}

              {result && (
                <div className={`mt-3 p-3 rounded ${result.valid ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                  <h5>{result.valid ? 'VALID TICKET' : 'INVALID TICKET'}</h5>
                  {result.valid ? (
                    <div>
                      <p>Passenger: {result.ticket?.passengerName}</p>
                      {result.ticket?.beneficiaryName && <p>For: {result.ticket.beneficiaryName}{result.ticket.beneficiaryPhone ? ` (${result.ticket.beneficiaryPhone})` : ''}</p>}
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
