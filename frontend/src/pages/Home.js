// client/src/pages/Home.js
import React, { useState } from 'react';
import { fetchBusinesses } from '../api';

const Home = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);

  const getNearby = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const { data } = await fetchBusinesses(latitude, longitude, 10000);
        setBusinesses(data);
      } catch (err) {
        alert("Failed to fetch. Make sure your backend is running!");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="container">
      <section className="hero">
        <h1>Find what's <span style={{color: 'var(--primary)'}}>near you.</span></h1>
        <p>Discover local businesses, read reviews, and explore your neighborhood with ease.</p>
        <button onClick={getNearby} className="btn-primary">
          {loading ? 'Locating...' : 'Explore Nearby'}
        </button>
      </section>

      <div className="business-grid">
        {businesses.map((b) => (
          <div key={b._id} className="card">
            <span className="category">{b.category}</span>
            <h3>{b.name}</h3>
            <p>{b.description}</p>
            <div className="card-footer">
              <span>📍 {b.address}</span>
              <span style={{fontWeight: '600', color: '#f59e0b'}}>★ {b.avgRating || '5.0'}</span>
            </div>
          </div>
        ))}
      </div>

      {!loading && businesses.length === 0 && (
        <div style={{textAlign: 'center', color: 'var(--text-muted)', padding: '40px'}}>
           No businesses found. Try clicking "Explore Nearby" above.
        </div>
      )}
    </div>
  );
};

export default Home;