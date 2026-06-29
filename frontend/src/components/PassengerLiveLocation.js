import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const KIGALI = { lat: -1.9441, lng: 30.0619 };

function PassengerLiveLocation() {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setError(null);
        if (mapRef.current) {
          mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 16);
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        if (!position) setPosition(KIGALI);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    setWatchId(id);

    return () => { if (id) navigator.geolocation.clearWatch(id); };
  }, []);

  const center = position || KIGALI;

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <h5 style={{ margin: 0 }}>My Live Location</h5>
          {position && (
            <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>
              LIVE
            </span>
          )}
          {accuracy && (
            <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: 'auto' }}>
              Accuracy: ±{Math.round(accuracy)}m
            </span>
          )}
        </div>

        {error && (
          <div className="alert alert-warning py-2" style={{ fontSize: '0.85rem' }}>{error}</div>
        )}

        <div style={{ height: 350, borderRadius: 8, overflow: 'hidden' }}>
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {position && (
              <>
                <CircleMarker
                  center={[position.lat, position.lng]}
                  radius={10}
                  pathOptions={{ color: '#dc3545', fillColor: '#dc3545', fillOpacity: 0.8, weight: 2 }}
                >
                  <Popup>
                    You are here<br />
                    {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                    {accuracy ? <br /> : null}
                    {accuracy ? `±${Math.round(accuracy)}m accuracy` : null}
                  </Popup>
                </CircleMarker>
                {accuracy && accuracy < 200 && (
                  <CircleMarker
                    center={[position.lat, position.lng]}
                    radius={accuracy / 2}
                    pathOptions={{ color: '#dc3545', fillColor: '#dc3545', fillOpacity: 0.08, weight: 1 }}
                  />
                )}
              </>
            )}
            {!position && (
              <CircleMarker
                center={[KIGALI.lat, KIGALI.lng]}
                radius={8}
                pathOptions={{ color: '#6c757d', fillColor: '#6c757d', fillOpacity: 0.5, weight: 1 }}
              >
                <Popup>Approximate location (Kigali)</Popup>
              </CircleMarker>
            )}
          </MapContainer>
        </div>

        {position && (
          <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
            {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </div>
        )}
      </div>
    </div>
  );
}

export default PassengerLiveLocation;
