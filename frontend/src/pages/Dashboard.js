import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBusiness } from '../api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', category: '', description: '', address: '', lng: '', lat: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Owner guard — redirect non-owners away
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
    } else if (user.role !== 'owner') {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      await createBusiness({
        ...form,
        lng: parseFloat(form.lng),
        lat: parseFloat(form.lat),
      });
      setMsg({ text: 'Business listed successfully!', type: 'success' });
      setForm({ name: '', category: '', description: '', address: '', lng: '', lat: '' });
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Failed to add business. Check all fields and try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { marginBottom: '12px' };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '6px' }}>Business Dashboard</h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>List your business to reach local customers.</p>
      <hr style={{ margin: '0 0 24px', border: '0', borderTop: '1px solid #e5e7eb' }} />

      {msg.text && (
        <p style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          backgroundColor: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: msg.type === 'success' ? '#166534' : '#dc2626',
          border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {msg.type === 'success' ? '✅' : '❌'} {msg.text}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          placeholder="Business Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          style={inputStyle}
          placeholder="Category (e.g. Cafe, Gym)"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          required
        />
        <textarea
          placeholder="Short Description"
          value={form.description}
          style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', height: '100px', marginBottom: '12px', fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }}
          onChange={e => setForm({ ...form, description: e.target.value })}
        />
        <input
          style={inputStyle}
          placeholder="Address"
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
          required
        />

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={form.lng}
            onChange={e => setForm({ ...form, lng: e.target.value })}
            required
          />
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={form.lat}
            onChange={e => setForm({ ...form, lat: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary-full"
          style={{ width: '100%', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'Adding...' : 'Add Business'}
        </button>
      </form>
    </div>
  );
};

export default Dashboard;