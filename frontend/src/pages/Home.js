import React, { useState } from 'react';
import { fetchBusinesses, addReview } from '../api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41], 
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CATEGORIES = ['Cafe', 'Restaurant', 'Gym', 'Salon', 'Bakery', 'Shop'];
const CATEGORY_EMOJI = {
  Cafe: '☕', Restaurant: '🍽️', Gym: '💪',
  Salon: '✂️', Bakery: '🥐', Shop: '🛍️', Other: '📦',
};

const DISTANCES = [
  { label: '1 km', value: 1000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '25 km', value: 25000 },
];

const Home = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [activeDist, setActiveDist] = useState(10000);
  const [searched, setSearched] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [fetchError, setFetchError] = useState('');
  
  // Review States
  const [selectedBusiness, setSelectedBusiness] = useState(null); 
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const user = JSON.parse(localStorage.getItem('user'));

  const doSearch = (lat, lng, category = activeCategory, dist = activeDist) => {
    setLoading(true);
    setFetchError('');
    fetchBusinesses(lat, lng, dist, category)
      .then(({ data }) => {
        setBusinesses(data);
        setSearched(true);
      })
      .catch((err) => {
        if (err.request && !err.response) {
          setFetchError('Cannot reach the server. Make sure your backend is running on port 5000.');
        } else {
          setFetchError(err.response?.data?.message || 'Failed to fetch businesses.');
        }
        setSearched(true);
      })
      .finally(() => setLoading(false));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await addReview(selectedBusiness._id, reviewForm);
      alert("Review posted successfully!");
      setSelectedBusiness(null);
      setReviewForm({ rating: 5, comment: '' });
      // Refresh to show updated ratings
      if (userCoords) doSearch(userCoords.lat, userCoords.lng); 
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post review");
    }
  };

  const getNearby = () => {
    if (!navigator.geolocation) {
      setFetchError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        doSearch(latitude, longitude);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setFetchError('Location access was denied. Please allow location access in your browser and try again.');
        } else {
          setFetchError('Could not determine your location. Please try again.');
        }
      },
      { timeout: 10000 }
    );
  };

  const handleCategory = (cat) => {
    const next = activeCategory === cat ? '' : cat;
    setActiveCategory(next);
    if (userCoords) doSearch(userCoords.lat, userCoords.lng, next, activeDist);
  };

  const handleDist = (dist) => {
    setActiveDist(dist);
    if (userCoords) doSearch(userCoords.lat, userCoords.lng, activeCategory, dist);
  };

  return (
    <>
      <div className="home-hero">
        <h1>Find what's <em>near you.</em></h1>
        <p>Discover local businesses, read reviews, and explore your neighbourhood with ease.</p>
        <div className="search-bar">
          <input type="text" placeholder="Cafes, gyms, restaurants near me…" readOnly />
          <button className="btn-search" onClick={getNearby} disabled={loading}>
            {loading ? 'Locating…' : '📍 Explore nearby'}
          </button>
        </div>
      </div>

      <div className="filter-row">
        <span className="filter-label">Category</span>
        {CATEGORIES.map(cat => (
          <button key={cat} className={`chip${activeCategory === cat ? ' active' : ''}`}
            onClick={() => handleCategory(cat)}>
            {CATEGORY_EMOJI[cat]} {cat}
          </button>
        ))}
        <span className="filter-label" style={{ marginLeft: '8px' }}>Radius</span>
        {DISTANCES.map(d => (
          <button key={d.value} className={`chip${activeDist === d.value ? ' active' : ''}`}
            onClick={() => handleDist(d.value)}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="businesses-section">
        {fetchError && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>{fetchError}</div>
        )}

        {businesses.length > 0 && (
          <div className="section-header">
            <h2 className="section-title">{activeCategory ? `${activeCategory}s` : 'Nearby businesses'}</h2>
            <span className="section-count">
              {businesses.length} found within {DISTANCES.find(d => d.value === activeDist)?.label}
            </span>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Finding businesses…</h3>
            <p>Hang tight while we locate what's around you.</p>
          </div>
        )}

        {/* SEARCHED BUT NOTHING FOUND */}
        {!loading && searched && !fetchError && businesses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <h3>Nothing found nearby</h3>
            <p>
              No businesses found within {DISTANCES.find(d => d.value === activeDist)?.label}
              {activeCategory ? ` in "${activeCategory}"` : ''}.
            </p>
            <p style={{ marginTop: '8px', fontSize: '0.85rem' }}>
              Try a wider radius, a different category, or{' '}
              {userCoords && (
                <span style={{ color: 'var(--ink-muted)' }}>
                  (your position: {userCoords.lat.toFixed(4)}°, {userCoords.lng.toFixed(4)}°)
                </span>
              )}
            </p>
            {userCoords && (
              <MapContainer center={[userCoords.lat, userCoords.lng]} zoom={13} style={{ height: '400px', borderRadius: '15px', marginTop: '20px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </MapContainer>
            )}
          </div>
        )}

        {/* INITIAL STATE: READY TO EXPLORE */}
        {!loading && !searched && !fetchError && (
          <div className="empty-state">
            <div className="empty-icon">🏘️</div>
            <h3>Ready to explore?</h3>
            <p>Hit "Explore nearby" to see businesses around your current location.</p>
          </div>
        )}

        {/* MAP FOR SUCCESSFUL RESULTS */}
        {!loading && userCoords && businesses.length > 0 && (
          <MapContainer center={[userCoords.lat, userCoords.lng]} zoom={13} style={{ height: '400px', borderRadius: '15px', marginBottom: '30px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {businesses.map(b => (
              <Marker key={b._id} position={[b.location.coordinates[1], b.location.coordinates[0]]}>
                <Popup>
                  <strong>{b.name}</strong><br/>
                  {b.address}<br/>
                  {user && <button onClick={() => setSelectedBusiness(b)} style={{marginTop: '5px', cursor: 'pointer'}}>Write Review</button>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* BUSINESS GRID */}
        <div className="business-grid">
          {!loading && businesses.map((b) => (
            <div key={b._id} className="card">
              <div className="card-thumb">{CATEGORY_EMOJI[b.category] || '📍'}</div>
              <div className="card-body">
                <span className="category-badge">{b.category}</span>
                <h3 className="card-title">{b.name}</h3>
                <p className="card-desc">{b.description || 'No description provided.'}</p>
                <div className="card-footer">
                  <span>📍 {b.address}</span>
                  <span className="card-rating">
                    <span className="star">★</span> {b.avgRating ? Number(b.avgRating).toFixed(1) : '—'}
                    {b.reviewCount > 0 && <span style={{ fontWeight: 400, color: 'var(--ink-muted)', marginLeft: 2 }}>({b.reviewCount})</span>}
                  </span>
                </div>
                {user && (
                  <button className="btn-accent" style={{ marginTop: '15px', padding: '8px', fontSize: '0.8rem', width: '100%' }} onClick={() => setSelectedBusiness(b)}>
                    Write a Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEW MODAL */}
      {selectedBusiness && (
        <div className="modal-overlay">
          <div className="auth-card" style={{ maxWidth: '450px' }}>
            <h2 className="page-title">Review {selectedBusiness.name}</h2>
            <form className="auth-form" onSubmit={handleReviewSubmit}>
              <div className="field-group">
                <label className="field-label">Rating</label>
                <select className="field-input field-select" value={reviewForm.rating} onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}>
                  {[5,4,3,2,1].map(num => <option key={num} value={num}>{num} Stars</option>)}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Your Experience</label>
                <textarea className="field-input field-textarea" placeholder="Share your thoughts..." required value={reviewForm.comment} onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})} />
              </div>
              <button type="submit" className="btn-primary">Post Review</button>
              <button type="button" className="btn-nav-logout" style={{width: '100%', marginTop: '10px'}} onClick={() => setSelectedBusiness(null)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;