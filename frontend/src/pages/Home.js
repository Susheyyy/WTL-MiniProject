import React, { useState } from 'react';
import { fetchBusinesses } from '../api';

const CATEGORIES = ['Cafe', 'Restaurant', 'Gym', 'Salon', 'Bakery', 'Shop'];

const CATEGORY_EMOJI = {
  Cafe: '☕', Restaurant: '🍽️', Gym: '💪',
  Salon: '✂️', Bakery: '🥐', Shop: '🛍️',
};

const DEFAULT_EMOJI = '📍';

const Home = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [searched, setSearched] = useState(false);

  const getNearby = (category = activeCategory) => {
    setLoading(true);
    setSearched(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const { data } = await fetchBusinesses(latitude, longitude, 10000, category);
          setBusinesses(data);
        } catch {
          alert('Failed to fetch. Make sure your backend is running!');
        } finally {
          setLoading(false);
        }
      },
      () => {
        alert('Location access denied. Please enable it in your browser.');
        setLoading(false);
      }
    );
  };

  const handleCategory = (cat) => {
    const next = activeCategory === cat ? '' : cat;
    setActiveCategory(next);
    if (searched) getNearby(next);
  };

  return (
    <>
      {/* Hero */}
      <div className="home-hero">
        <h1>
          Find what's <em>near you.</em>
        </h1>
        <p>Discover local businesses, read reviews, and explore your neighbourhood with ease.</p>

        <div className="search-bar">
          <input type="text" placeholder="Cafes, gyms, restaurants near me…" readOnly />
          <button className="btn-search" onClick={() => getNearby(activeCategory)} disabled={loading}>
            {loading ? 'Locating…' : '📍 Explore nearby'}
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="filter-row">
        <span className="filter-label">Filter</span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip${activeCategory === cat ? ' active' : ''}`}
            onClick={() => handleCategory(cat)}
          >
            {CATEGORY_EMOJI[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="businesses-section">
        {businesses.length > 0 && (
          <div className="section-header">
            <h2 className="section-title">
              {activeCategory ? `${activeCategory}s` : 'Nearby businesses'}
            </h2>
            <span className="section-count">{businesses.length} found</span>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Finding businesses…</h3>
            <p>Hang tight while we locate what's around you.</p>
          </div>
        )}

        {!loading && searched && businesses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <h3>Nothing found nearby</h3>
            <p>Try a different category, or ask a business owner to list on LocalDistro.</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="empty-state">
            <div className="empty-icon">🏘️</div>
            <h3>Ready to explore?</h3>
            <p>Hit "Explore nearby" to see businesses around your current location.</p>
          </div>
        )}

        <div className="business-grid">
          {!loading && businesses.map((b) => (
            <div key={b._id} className="card">
              <div className="card-thumb">
                {CATEGORY_EMOJI[b.category] || DEFAULT_EMOJI}
              </div>
              <div className="card-body">
                <span className="category-badge">{b.category}</span>
                <h3 className="card-title">{b.name}</h3>
                <p className="card-desc">{b.description || 'No description provided.'}</p>
                <div className="card-footer">
                  <span>📍 {b.address}</span>
                  <span className="card-rating">
                    <span className="star">★</span>
                    {b.avgRating ? Number(b.avgRating).toFixed(1) : '—'}
                    {b.reviewCount > 0 && (
                      <span style={{ fontWeight: 400, color: 'var(--ink-muted)', marginLeft: 2 }}>
                        ({b.reviewCount})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;