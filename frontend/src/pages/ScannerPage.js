import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ticketAPI, busAPI } from '../services/api';

function ScannerPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);

  const [qrInput, setQrInput] = useState('');
  const [result, setResult] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [activeTrip, setActiveTrip] = useState(null);
  const [message, setMessage] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [detectedBox, setDetectedBox] = useState(null);

  useEffect(() => {
    loadBuses();
    loadActiveTrip();

    const onPipClose = () => setPipActive(false);
    const video = videoRef.current;
    if (video) {
      video.addEventListener('leavepictureinpicture', onPipClose);
    }
    return () => {
      stopCamera();
      if (video) video.removeEventListener('leavepictureinpicture', onPipClose);
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

  const stopCamera = () => {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setPipActive(false);
    setDetectedBox(null);
  };

  const togglePip = useCallback(async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      setPipActive(false);
    } else if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        await videoRef.current.requestPictureInPicture();
        setPipActive(true);
      } catch (err) {
        console.error('PiP failed:', err);
      }
    }
  }, []);

  const toggleFullscreenCamera = () => {
    const el = document.getElementById('camera-viewfinder');
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
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

  const drawOverlay = (barcodes) => {
    const overlay = overlayRef.current;
    const video = videoRef.current;
    if (!overlay || !video) return;

    const rect = video.getBoundingClientRect();
    overlay.width = rect.width;
    overlay.height = rect.height;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const sx = rect.width / video.videoWidth;
    const sy = rect.height / video.videoHeight;

    barcodes.forEach((b) => {
      const { x, y, width, height } = b.boundingBox;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      ctx.strokeRect(x * sx, y * sy, width * sx, height * sy);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('QR DETECTED', x * sx, y * sy - 6);
    });
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
          drawOverlay(barcodes);
          if (barcodes.length > 0) {
            setDetectedBox(barcodes[0].boundingBox);
            const scannedValue = barcodes[0].rawValue;
            if (scannedValue) {
              scanningRef.current = true;
              setQrInput(scannedValue);
              await verifyTicket(scannedValue);
              setTimeout(() => {
                scanningRef.current = false;
              }, 2500);
            }
          } else {
            setDetectedBox(null);
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

  const handleVerify = async () => {
    await verifyTicket(qrInput);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage('Reading QR image...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imageDataUrl = reader.result;
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);

            if (typeof window.BarcodeDetector !== 'undefined') {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const barcode = await detector.detect(canvas);
              const value = barcode?.[0]?.rawValue;
              if (value) {
                setQrInput(value);
                await verifyTicket(value);
              } else {
                setResult({ valid: false, error: 'No QR code found in image' });
                setMessage('No QR code found in image');
              }
            } else {
              setResult({ valid: false, error: 'QR image scanning is not supported in this browser' });
              setMessage('QR image scanning is not supported in this browser');
            }
          };
          img.src = imageDataUrl;
        } catch (err) {
          setResult({ valid: false, error: 'Failed to read QR image' });
          setMessage('Failed to read QR image');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setMessage('Failed to upload image');
      setIsUploading(false);
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

      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body py-2 d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                <strong>Hardware scanner:</strong> Use the Python QR scanner in the <code>hard_scanner/</code> directory for dedicated camera-based scanning.
              </span>
              <a href="hard_scanner/README.md" className="btn btn-outline-secondary btn-sm" target="_blank" rel="noreferrer">Docs</a>
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

              <div className="d-flex gap-2 mb-3">
                <button className="btn btn-outline-primary" onClick={startCameraScan}>
                  {cameraOpen ? 'Close Camera' : 'Open Camera'}
                </button>
                <button className="btn btn-outline-secondary" onClick={() => {
                  setQrInput('');
                  setResult(null);
                  setMessage('');
                  setCameraError('');
                }}>Clear</button>
              </div>

              {cameraError && <div className="alert alert-warning">{cameraError}</div>}

              {cameraOpen && (
                <div id="camera-viewfinder" className="mb-3 position-relative" style={{ minHeight: 240 }}>
                  <div className="position-relative">
                    <video ref={videoRef} className="w-100 rounded border" playsInline muted autoPlay style={{ display: 'block' }} />
                    <canvas ref={overlayRef}
                      className="position-absolute top-0 start-0 w-100 h-100 rounded"
                      style={{ pointerEvents: 'none' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {detectedBox && (
                      <div className="position-absolute top-0 end-0 m-2 badge bg-success bg-opacity-75">
                        QR Code Detected
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={toggleFullscreenCamera}
                      title="Fullscreen camera view">
                      ⛶ Fullscreen
                    </button>
                    {document.pictureInPictureEnabled && (
                      <button className="btn btn-sm btn-outline-info" onClick={togglePip}
                        title="Picture-in-Picture mode">
                        {pipActive ? 'Exit PiP' : 'PiP Mode'}
                      </button>
                    )}
                  </div>
                  <p className="text-muted small mt-1 mb-0">
                    Camera is running. Hold the ticket QR in front of the camera. A green box will appear when a QR code is detected.
                  </p>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Upload saved QR image</label>
                <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div className="mb-3">
                <textarea className="form-control" rows="3"
                  placeholder="Paste QR data here..."
                  value={qrInput} onChange={(e) => setQrInput(e.target.value)} />
              </div>
              <button className="btn btn-primary w-100" onClick={handleVerify}
                disabled={!qrInput.trim() || isUploading}>Verify Ticket</button>

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
