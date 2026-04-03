import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBusiness, fetchBusinesses } from '../api';

const CATEGORIES = ['Cafe', 'Restaurant', 'Gym', 'Salon', 'Bakery', 'Shop', 'Other'];

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [form, setForm] = useState({
    name: '', category: 'Cafe', description: '', address: '', lng: '', lat: '',
  });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [myBusinesses, setMyBusinesses] = useState([]);

  // Owner guard
  useEffect(() => {
    if (!user) navigate('/login');
    else if (user.role !== 'owner') navigate('/');
  }, [navigate]);

  // Load existing businesses for this owner
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        // Fetch all businesses with a wide search — we'll filter by owner client-side
        // since we don't have a /my-businesses endpoint yet
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { data } = await fetchBusinesses(pos.coords.latitude, pos.coords.longitude, 50000);
          setMyBusinesses(data.filter(b => b.owner === user?.id || b.owner?._id === user?.id));
        });
      } catch {
        // silently fail if no location
      }
    };
    loadBusinesses();
  }, []);

  const detectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setMsg({ text: 'Location access denied. Please enter coordinates manually.', type: 'error' });
        setLocating(false);
      }
    );
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const saved = await createBusiness({
        ...form,
        lng: parseFloat(form.lng),
        lat: parseFloat(form.lat),
      });
      setMsg({ text: 'Business listed successfully! It will now appear in nearby searches.', type: 'success' });
      setMyBusinesses(prev => [saved.data, ...prev]);
      setForm({ name: '', category: 'Cafe', description: '', address: '', lng: form.lng, lat: form.lat });
    } catch (err) {
      if (err.request && !err.response) {
        setMsg({ text: 'Cannot reach the server. Is your backend running?', type: 'error' });
      } else {
        setMsg({ text: err.response?.data?.message || 'Failed to add business.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <p className="page-eyebrow">Owner dashboard</p>
      <h1 className="page-title">List your business</h1>
      <p className="page-sub">Fill in the details below to make your business discoverable to nearby customers.</p>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '24px' }}>
          {msg.text}
        </div>
      )}

      <div className="form-card">
        <p className="form-card-title">Business details</p>
        <form className="dashboard-form" onSubmit={handleSubmit}>

          <div className="field-group">
            <label className="field-label" htmlFor="name">Business name</label>
            <input id="name" className="field-input" placeholder="e.g. Blue Bottle Coffee"
              value={form.name} onChange={set('name')} required />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="category">Category</label>
            <select id="category" className="field-input field-select" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="desc">Short description</label>
            <textarea id="desc" className="field-input field-textarea"
              placeholder="What makes your business special?"
              value={form.description} onChange={set('description')} />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="address">Address</label>
            <input id="address" className="field-input" placeholder="123 Main Street, City"
              value={form.address} onChange={set('address')} required />
          </div>

          {/* Location row */}
          <div className="field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="field-label">Location coordinates</label>
              <button type="button" className="btn-locate" onClick={detectLocation} disabled={locating}>
                {locating ? (
                  <><span className="spinner spinner-dark" />Detecting…</>
                ) : (
                  <>📍 Use my location</>
                )}
              </button>
            </div>

            {form.lat && form.lng ? (
              <div className="location-preview">
                <span className="location-dot" />
                <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                  {parseFloat(form.lat).toFixed(4)}°N, {parseFloat(form.lng).toFixed(4)}°E
                </span>
                <a
                  href={`https://www.google.com/maps?q=${form.lat},${form.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}
                >
                  Verify on map ↗
                </a>
              </div>
            ) : (
              <div className="location-empty">
                No location set — click "Use my location" or enter below
              </div>
            )}

            <div className="form-row" style={{ marginTop: '8px' }}>
              <div className="field-group">
                <label className="field-label" htmlFor="lat">Latitude</label>
                <input id="lat" type="number" step="any" className="field-input"
                  placeholder="e.g. 19.0760"
                  value={form.lat} onChange={set('lat')} required />
              </div>
              <div className="field-group">
                <label className="field-label" htmlFor="lng">Longitude</label>
                <input id="lng" type="number" step="any" className="field-input"
                  placeholder="e.g. 72.8777"
                  value={form.lng} onChange={set('lng')} required />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-accent" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Saving…' : 'Add business'}
          </button>
        </form>
      </div>

      {/* My listings */}
      {myBusinesses.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <p className="page-eyebrow">Your listings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {myBusinesses.map(b => (
              <div key={b._id} className="listing-row">
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{b.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                    {b.category} · {b.address}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
                    ★ {b.avgRating || '—'} ({b.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;