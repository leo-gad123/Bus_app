import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ticketAPI, busAPI } from '../services/api';

function ScannerPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);
  const scanTimerRef = useRef(null);

  const [result, setResult] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [activeTrip, setActiveTrip] = useState(null);
  const [message, setMessage] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadBuses();
    loadActiveTrip();
    return () => {
      stopCamera();
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setResult(null);
    setMessage('');
  }, []);

  const verifyTicket = async (value) => {
    const code = (value || '').trim();
    if (!code) return;

    try {
      const { data } = await ticketAPI.verify(code, selectedBus || undefined);
      setResult(data);
      setMessage(data.valid ? 'Ticket verified! ✓' : 'Invalid ticket ✗');
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
      setResult(null);
      setMessage('');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (typeof window.BarcodeDetector !== 'undefined') {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      } else {
        setCameraError('BarcodeDetector API not supported. Use a Chromium-based browser.');
        stopCamera();
        return;
      }

      setCameraOpen(true);
      setIsScanning(true);
      setMessage('Camera ready. Point at a QR code.');
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
              setIsScanning(false);
              setMessage('QR detected! Verifying...');
              await verifyTicket(scannedValue);
              if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
              scanTimerRef.current = setTimeout(() => {
                scanningRef.current = false;
                setIsScanning(true);
                setMessage('Camera ready. Point at a QR code.');
              }, 3000);
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

  const handleClear = () => {
    setResult(null);
    setMessage('');
    setCameraError('');
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
                  <p>Passengers: {activeTrip.passengerCount} | Revenue: RWF {activeTrip.revenue}</p>
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

      {message && (
        <div className={`alert ${result?.valid ? 'alert-success' : result && !result.valid ? 'alert-danger' : 'alert-info'} d-flex justify-content-between align-items-center`}>
          <span>{message}</span>
          <button className="btn-close" onClick={handleClear}></button>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-8 mx-auto">
          <div className="card">
            <div className="card-body">
              <h5>Scan QR Ticket</h5>
              <p className="text-muted">Real-time camera QR scanner. Point the camera at a ticket QR code.</p>

              <div className="d-flex gap-2 mb-3">
                <button className={`btn ${cameraOpen ? 'btn-danger' : 'btn-primary'}`} onClick={startCameraScan}>
                  {cameraOpen ? 'Close Camera' : 'Open Camera'}
                </button>
                <button className="btn btn-outline-secondary" onClick={handleClear}
                  disabled={!result && !message && !cameraError}>Clear</button>
              </div>

              {cameraError && <div className="alert alert-warning">{cameraError}</div>}

              {cameraOpen && (
                <div className="mb-3 position-relative">
                  <video ref={videoRef} className="w-100 rounded border" playsInline muted autoPlay
                    style={{ minHeight: 240, background: '#000' }} />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {isScanning && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Scanning...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result && (
                <div className={`p-3 rounded ${result.valid ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                  <h4 className="mb-2">{result.valid ? '✓ VALID TICKET' : '✗ INVALID TICKET'}</h4>
                  {result.valid ? (
                    <div>
                      <p className="mb-1"><strong>Passenger:</strong> {result.ticket?.passengerName}</p>
                      {result.ticket?.beneficiaryName && <p className="mb-1"><strong>For:</strong> {result.ticket.beneficiaryName}{result.ticket.beneficiaryPhone ? ` (${result.ticket.beneficiaryPhone})` : ''}</p>}
                      <p className="mb-1"><strong>Fare:</strong> RWF {result.ticket?.fare}</p>
                      <p className="mb-0"><strong>Verified at:</strong> {new Date(result.ticket?.usedAt).toLocaleTimeString()}</p>
                    </div>
                  ) : (
                    <p className="mb-0">{result.error}</p>
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
