import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBusiness } from '../api';

const CATEGORIES = ['Cafe', 'Restaurant', 'Gym', 'Salon', 'Bakery', 'Shop', 'Other'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', category: 'Cafe', description: '', address: '', lng: '', lat: '',
  });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/login');
    else if (user.role !== 'owner') navigate('/');
  }, [navigate]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      await createBusiness({ ...form, lng: parseFloat(form.lng), lat: parseFloat(form.lat) });
      setMsg({ text: 'Business listed successfully! It will appear in search results.', type: 'success' });
      setForm({ name: '', category: 'Cafe', description: '', address: '', lng: '', lat: '' });
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Failed to add business. Check all fields.',
        type: 'error',
      });
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
            <input
              id="name" className="field-input" placeholder="e.g. Blue Bottle Coffee"
              value={form.name} onChange={set('name')} required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="category">Category</label>
            <select id="category" className="field-input field-select" value={form.category} onChange={set('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="desc">Short description</label>
            <textarea
              id="desc" className="field-input field-textarea"
              placeholder="What makes your business special?"
              value={form.description} onChange={set('description')}
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="address">Address</label>
            <input
              id="address" className="field-input" placeholder="123 Main Street, City"
              value={form.address} onChange={set('address')} required
            />
          </div>

          <div className="form-row">
            <div className="field-group">
              <label className="field-label" htmlFor="lng">Longitude</label>
              <input
                id="lng" type="number" step="any" className="field-input" placeholder="e.g. 72.8777"
                value={form.lng} onChange={set('lng')} required
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="lat">Latitude</label>
              <input
                id="lat" type="number" step="any" className="field-input" placeholder="e.g. 19.0760"
                value={form.lat} onChange={set('lat')} required
              />
            </div>
          </div>

          <button type="submit" className="btn-accent" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Saving...' : 'Add business'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;