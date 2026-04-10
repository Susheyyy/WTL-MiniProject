import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem('token');
        const endpoint = user.role === 'owner' 
          ? 'http://localhost:5000/api/businesses/owner/customer-feedback'
          : 'http://localhost:5000/api/businesses/user/my-reviews';
        
        const { data } = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReviews(data);
      } catch (err) {
        console.error("Error loading reviews", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchReviews();
  }, [user]);

  return (
    <div className="dashboard-wrapper">
      <p className="page-eyebrow">Account Settings</p>
      <h1 className="page-title">{user.role === 'owner' ? 'Customer Feedback' : 'My Reviews'}</h1>
      <p className="page-sub">
        {user.role === 'owner' 
          ? 'What people are saying about your businesses.' 
          : 'A history of reviews you have shared.'}
      </p>

      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <div className="empty-state"><span className="spinner spinner-dark" /></div>
        ) : reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map(rev => (
              <div key={rev._id} className="form-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{rev.business?.name}</h3>
                  <span className="card-rating">★ {rev.rating}</span>
                </div>
                {user.role === 'owner' && <p style={{fontSize: '0.8rem', fontWeight: '600'}}>User: {rev.user?.name}</p>}
                <p style={{ color: 'var(--ink-soft)', marginTop: '8px' }}>"{rev.comment}"</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: '10px' }}>
                  {new Date(rev.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No reviews to show yet.</div>
        )}
      </div>
    </div>
  );
};

export default Profile;