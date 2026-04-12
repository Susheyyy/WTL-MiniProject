import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CATEGORIES = ['Food' , 'Cafe' , 'Stationery' , 'Hostel/PG' , 'Gym', 'Shop' , 'Other'];

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [myBusinesses, setMyBusinesses] = useState([]);
  const [showForm, setShowForm] = useState(false); 
  const [form, setForm] = useState({
    name: '', category: 'Cafe', description: '', address: '', lng: '', lat: '', imageFile: null
  });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
    else if (user.role !== 'owner') navigate('/');
  }, [navigate, user]);

  useEffect(() => {
    const loadOwnerBusinesses = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/businesses/my-businesses', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMyBusinesses(data);
      } catch (err) {
        console.error("Error loading owner listings:", err);
      }
    };
    if (user) loadOwnerBusinesses();
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this business? All reviews will be lost.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/businesses/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMyBusinesses(myBusinesses.filter(b => b._id !== id));
      setMsg({ text: 'Business deleted successfully', type: 'success' });
    } catch (err) {
      setMsg({ text: 'Failed to delete business', type: 'error' });
    }
  };

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
        setMsg({ text: 'Location access denied.', type: 'error' });
        setLocating(false);
      }
    );
  };

  const setField = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('address', form.address);
    formData.append('lng', form.lng);
    formData.append('lat', form.lat);
    if (form.imageFile) {
      formData.append('image', form.imageFile);
    }

    try {
      const { data } = await axios.post('http://localhost:5000/api/businesses', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        }
      });
      setMsg({ text: 'Business listed successfully!', type: 'success' });
      setMyBusinesses(prev => [data, ...prev]);
      setForm({ name: '', category: 'Cafe', description: '', address: '', lng: '', lat: '', imageFile: null });
      setShowForm(false); 
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to add business.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <h1 className="page-title">Manage your listings</h1>

      <div style={{ marginTop: '20px' }}>
        <p className="page-eyebrow">Your listings</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {myBusinesses.length > 0 ? (
            myBusinesses.map(b => (
              <div key={b._id} className="listing-row">
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{b.name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                    {b.category} · {b.address}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '0.85rem' }}>
                    ★ {b.avgRating || '—'} ({b.reviewCount || 0} reviews)
                  </span>
                  <button 
                    onClick={() => handleDelete(b._id)}
                    style={{ background: 'none', border: 'none', color: 'var(--error-text)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="location-empty">You haven't added any businesses yet.</div>
          )}
        </div>
      </div>

      {!showForm && (
        <button className="btn-accent" style={{ marginTop: '32px' }} onClick={() => setShowForm(true)}>
          + Add business
        </button>
      )}

      {showForm && (
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="page-title" style={{ fontSize: '1.5rem' }}>List your business</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }}>
              Cancel
            </button>
          </div>

          {msg.text && (
            <div className={`alert alert-${msg.type}`} style={{ margin: '16px 0' }}>{msg.text}</div>
          )}

          <div className="form-card" style={{ marginTop: '16px' }}>
            <p className="form-card-title">Business details</p>
            <form className="dashboard-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Business name</label>
                <input className="field-input" placeholder="e.g. Blue Bottle Coffee" value={form.name} onChange={setField('name')} required />
              </div>

              <div className="field-group">
                <label className="field-label">Category</label>
                <select className="field-input field-select" value={form.category} onChange={setField('category')}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Business Image</label>
                <input 
                  type="file" 
                  className="field-input" 
                  accept="image/*"
                  onChange={(e) => setForm({...form, imageFile: e.target.files[0]})} 
                />
              </div>

              <div className="field-group">
                <label className="field-label">Short description</label>
                <textarea className="field-input field-textarea" placeholder="What makes your business special?" value={form.description} onChange={setField('description')} />
              </div>

              <div className="field-group">
                <label className="field-label">Address</label>
                <input className="field-input" placeholder="123 Main Street, City" value={form.address} onChange={setField('address')} required />
              </div>

              <div className="field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="field-label">Location coordinates</label>
                  <button type="button" className="btn-locate" onClick={detectLocation} disabled={locating}>
                    {locating ? "Detecting..." : "📍 Use my location"}
                  </button>
                </div>

                {!form.lat ? (
                  <div className="location-empty">No location set - click "Use my location" or enter below</div>
                ) : (
                  <div className="location-preview">
                    <span className="location-dot" />
                    <span>{form.lat}°N, {form.lng}°E</span>
                  </div>
                )}

                <div className="form-row" style={{ marginTop: '12px' }}>
                  <div className="field-group">
                    <label className="field-label">Latitude</label>
                    <input type="number" step="any" className="field-input" value={form.lat} onChange={setField('lat')} required />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Longitude</label>
                    <input type="number" step="any" className="field-input" value={form.lng} onChange={setField('lng')} required />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-accent" disabled={loading}>
                {loading ? "Saving..." : "Add business"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;