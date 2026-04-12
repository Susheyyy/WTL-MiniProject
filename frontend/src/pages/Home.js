import React, { useState, useEffect } from 'react';
import { fetchBusinesses, addReview } from '../api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { toast} from 'react-hot-toast';
import { Link } from 'react-router-dom';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41], 
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CATEGORIES = ['Cafe', 'Restaurant', 'Gym', 'Salon', 'Bakery', 'Shop', 'Other'];
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
  const [addressQuery, setAddressQuery] = useState(''); 
  
  const [selectedBusiness, setSelectedBusiness] = useState(null); 
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (addressQuery.length > 2) {
        handleAddressSearch();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [addressQuery]);

  const doSearch = (lat, lng, category = activeCategory, dist = activeDist) => {
    setLoading(true);
    setFetchError('');
    fetchBusinesses(lat, lng, dist, category)
      .then(({ data }) => {
        setBusinesses(data.businesses || []); 
        setSearched(true);
      })
      .catch((err) => {
        setFetchError(err.response?.data?.message || 'Server Error');
        setSearched(true);
      })
      .finally(() => setLoading(false));
  };

  const handleAddressSearch = async () => {
    if (!addressQuery) return;
    setLoading(true);
    setFetchError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${addressQuery}`);
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        setUserCoords({ lat: latitude, lng: longitude });
        doSearch(latitude, longitude);
      } else {
        setFetchError("Location not found. Try adding a city (e.g., 'Seawoods, Navi Mumbai')");
      }
    } catch (err) {
      setFetchError("Error finding location.");
    } finally {
      setLoading(false);
    }
  };

const handleReviewSubmit = async (e) => {
  e.preventDefault();
  const loadingToast = toast.loading('Posting your review...'); 
  try {
    await addReview(selectedBusiness._id, reviewForm);
    
    toast.success('Review posted successfully!', { id: loadingToast }); 
    setSelectedBusiness(null);
    setReviewForm({ rating: 5, comment: '' });
    if (userCoords) doSearch(userCoords.lat, userCoords.lng); 
    
  } catch (err) {
    const errorMsg = err.response?.data?.message || "Failed to post review";
    toast.error(errorMsg, { id: loadingToast }); 
  }
};

  const getNearby = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        doSearch(latitude, longitude);
      },
      () => {
        setLoading(false);
        setFetchError('Location access denied.');
      }
    );
  };

return (
    <>
      <div className="home-hero">
        <h1>Find what's <em>near you</em></h1>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Enter location" 
            value={addressQuery}
            onChange={(e) => setAddressQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
          />
          <button className="btn-search" onClick={handleAddressSearch} disabled={loading}>
            {loading ? 'Searching…' : ' Search'}
          </button>
        </div>
        <button onClick={getNearby} className="btn-locate-text" style={{marginTop: '12px', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: '500'}}>
            Use Current Location
        </button>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Category</span>
          <div className="filter-chips">
            {CATEGORIES.map(cat => (
              <button key={cat} className={`chip${activeCategory === cat ? ' active' : ''}`}
                onClick={() => {
                    const next = activeCategory === cat ? '' : cat;
                    setActiveCategory(next);
                    if (userCoords) doSearch(userCoords.lat, userCoords.lng, next);
                }}>
                {cat} 
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Radius</span>
          <div className="filter-chips">
            {DISTANCES.map(d => (
              <button key={d.value} className={`chip${activeDist === d.value ? ' active' : ''}`}
                onClick={() => {
                    setActiveDist(d.value);
                    if (userCoords) doSearch(userCoords.lat, userCoords.lng, activeCategory, d.value);
                }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="businesses-section">
        {fetchError && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{fetchError}</div>}
        {loading && <div className="empty-state"><h3>Finding businesses…</h3></div>}
        {!loading && searched && businesses.length === 0 && <div className="empty-state"><h3>Nothing found nearby</h3></div>}

        {!loading && userCoords && businesses.length > 0 && (
          <MapContainer center={[userCoords.lat, userCoords.lng]} zoom={13} style={{ height: '400px', borderRadius: '15px', marginBottom: '30px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {businesses.map(b => (
              <Marker key={b._id} position={[b.location.coordinates[1], b.location.coordinates[0]]}>
                <Popup>
                  <strong>{b.name}</strong><br/>
                  {b.address}<br/>
                  {user && user.role !== 'owner' && <button onClick={() => setSelectedBusiness(b)}>Write Review</button>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        <div className="business-grid">
          {!loading && businesses.map((b) => (
            <div key={b._id} className="card">
              <Link to={`/business/${b._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card-thumb" style={{ overflow: 'hidden', background: '#f5ece0' }}>
                  {b.images && b.images.length > 0 ? (
                    <img src={b.images[0]} alt={b.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <span style={{ fontSize: '2.8rem' }}>📍</span>
                  )}
                </div>
                <div className="card-body" style={{ paddingBottom: user ? '0' : '18px' }}>
                  <span className="category-badge">{b.category}</span>
                  <h3 className="card-title">{b.name}</h3>
                  <p className="card-desc">{b.description}</p>
                  <div className="card-footer">
                    <span style={{maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>📍 {b.address}</span>
                    <span className="card-rating"><span className="star">★</span> {b.avgRating ? Number(b.avgRating).toFixed(1) : '—'}</span>
                  </div>
                </div>
              </Link>
              {user && (
                <div className="card-action" style={{ padding: '0 18px 18px' }}>
                  <button className="btn-accent" style={{ marginTop: '15px', width: '100%' }} onClick={() => setSelectedBusiness(b)}>
                    Write a Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedBusiness && (
        <div className="modal-overlay">
          <div className="auth-card">
            <h2 className="review-form-title">Review {selectedBusiness.name}</h2>
            <p className="review-form-sub">Share your thoughts with the GoLocal community.</p>
            <form className="auth-form" onSubmit={handleReviewSubmit}>
              <div className="field-group">
                <label className="field-label">Rating</label>
                <select className="field-select rating-select" value={reviewForm.rating} onChange={(e) => setReviewForm({...reviewForm, rating: e.target.value})}>
                  <option value="5">5 Stars - Excellent</option>
                  <option value="4">4 Stars - Good</option>
                  <option value="3">3 Stars - Average</option>
                  <option value="2">2 Stars - Poor</option>
                  <option value="1">1 Star - Terrible</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Your Review</label>
                <textarea className="field-textarea review-text" placeholder="Tell us about your experience..." required value={reviewForm.comment} onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-post-review">Post Review</button>
                <button type="button" className="btn-cancel-review" onClick={() => setSelectedBusiness(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;