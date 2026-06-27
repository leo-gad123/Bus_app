import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { realtimeAPI, routeAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const busIcon = new L.DivIcon({
  className: 'bus-marker',
  html: '<div style="background:#16A34A;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">BUS</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const stopIcon = new L.DivIcon({
  className: 'stop-marker',
  html: '<div style="background:#2563EB;color:white;border-radius:50%;width:16px;height:16px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center]);
  return null;
}

function LiveMap() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedRouteData, setSelectedRouteData] = useState(null);
  const [etas, setEtas] = useState([]);
  const [message, setMessage] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: -1.9441, lng: 30.0619 })
    );
  }, []);

  useEffect(() => {
    loadRoutes();
    loadLiveBuses();

    socketRef.current = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socketRef.current.on('bus-location-update', (data) => {
      setBuses(prev => {
        const existing = prev.findIndex(b => b.bus?._id === data.busId || b.bus?.toString() === data.busId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], lat: data.lat, lng: data.lng, speed: data.speed || 0 };
          return updated;
        }
        return prev;
      });
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadNearbyStops();
    }
  }, [userLocation]);

  const loadRoutes = async () => {
    try {
      const { data } = await routeAPI.getAll();
      setRoutes(data);
    } catch (err) { console.error(err); }
  };

  const loadLiveBuses = async () => {
    try {
      const { data } = await realtimeAPI.liveBuses();
      setBuses(data);
    } catch (err) { console.error(err); }
  };

  const loadNearbyStops = async () => {
    if (!userLocation) return;
    try {
      const { data } = await realtimeAPI.nearbyStops(userLocation.lat, userLocation.lng, 5);
      setNearbyStops(data);
    } catch (err) { console.error(err); }
  };

  const handleRouteSelect = async (routeId) => {
    setSelectedRoute(routeId);
    setEtas([]);
    const route = routes.find(r => r._id === routeId);
    setSelectedRouteData(route || null);

    if (route && userLocation) {
      try {
        const { data } = await realtimeAPI.eta(routeId, userLocation.lat, userLocation.lng);
        setEtas(data);
      } catch (err) { console.error(err); }
    }
  };

  const mapCenter = userLocation || { lat: -1.9441, lng: 30.0619 };

  return (
    <div>
      <div className="row mb-3">
        <div className="col-md-8">
          <h5>Live Bus Tracking</h5>
        </div>
        <div className="col-md-4">
          <select className="form-select" value={selectedRoute} onChange={(e) => handleRouteSelect(e.target.value)}>
            <option value="">Select route for ETA</option>
            {routes.map(r => (
              <option key={r._id} value={r._id}>{r.name} ({r.startLocation} → {r.endLocation})</option>
            ))}
          </select>
        </div>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="row g-3">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body p-1" style={{ height: '500px' }}>
              <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} style={{ height: '100%', borderRadius: '12px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater center={[mapCenter.lat, mapCenter.lng]} />

                {userLocation && (
                  <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8} pathOptions={{ color: '#16A34A', fillOpacity: 0.3, weight: 2 }}>
                    <Popup>You are here</Popup>
                  </CircleMarker>
                )}

                {selectedRouteData?.stops?.map((stop, i) => (
                  stop.lat && stop.lng && (
                    <CircleMarker key={i} center={[stop.lat, stop.lng]} radius={5} pathOptions={{ color: '#2563EB', fillOpacity: 0.6 }}>
                      <Popup>{stop.name} - FRW {stop.fare}</Popup>
                    </CircleMarker>
                  )
                ))}

                {selectedRouteData?.coordinates?.length > 1 && (
                  <Polyline positions={selectedRouteData.coordinates.map(c => [c.lat, c.lng])} pathOptions={{ color: '#16A34A', weight: 3, opacity: 0.6 }} />
                )}

                {buses.filter(b => b.lat && b.lng).map((b, i) => (
                  <Marker key={b._id || i} position={[b.lat, b.lng]} icon={busIcon}>
                    <Popup>
                      <strong>Bus {b.bus?.busNumber || b.bus?.plateNumber || 'N/A'}</strong><br />
                      Driver: {b.driver?.name || 'N/A'}<br />
                      Speed: {Math.round(b.speed || 0)} km/h<br />
                      Last updated: {new Date(b.updatedAt).toLocaleTimeString()}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          {selectedRoute && etas.length > 0 && (
            <div className="card mb-3">
              <div className="card-body">
                <h5>Estimated Arrival</h5>
                {etas.slice(0, 5).map((e, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span>Bus {e.busNumber || 'N/A'}</span>
                    <span className="badge bg-success">{e.etaMinutes} min</span>
                  </div>
                ))}
                {etas.length === 0 && <p className="text-muted mb-0">No buses approaching</p>}
              </div>
            </div>
          )}

          <div className="card mb-3">
            <div className="card-body">
              <h5>Nearby Stops</h5>
              {nearbyStops.length === 0 ? (
                <p className="text-muted mb-0">Enable location to see nearby stops</p>
              ) : (
                nearbyStops.slice(0, 10).map((s, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <strong>{s.stopName}</strong><br />
                      <small className="text-muted">{s.routeName} - FRW {s.fare}</small>
                    </div>
                    <span className="badge bg-primary">{s.distance} km</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h5>Live Buses ({buses.length})</h5>
              {buses.length === 0 ? (
                <p className="text-muted mb-0">No active buses</p>
              ) : (
                buses.slice(0, 8).map((b, i) => (
                  <div key={i} className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span>Bus {b.bus?.busNumber || b.bus?.plateNumber || 'N/A'}</span>
                    <small className="text-muted">{Math.round(b.speed || 0)} km/h</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveMap;
