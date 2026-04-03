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
      <p className="page-eyebrow">Account Overview</p>
      <h1 className="page-title">
        {user.role === 'owner' ? 'Customer Feedback' : 'My Activity'}
      </h1>
      <p className="page-sub">
        {user.role === 'owner' 
          ? 'See what customers are saying about your businesses.' 
          : 'A history of all the reviews you have shared with the community.'}
      </p>

      <div style={{ marginTop: '30px' }}>
        {loading ? (
          <div className="empty-state"><span className="spinner spinner-dark" /></div>
        ) : reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviews.map(rev => (
              <div key={rev._id} className="form-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>
                    {rev.business?.name}
                  </h3>
                  <span className="card-rating">
                    <span className="star">★</span> {rev.rating}
                  </span>
                </div>
                
                {user.role === 'owner' && (
                  <p style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '8px' }}>
                    Review by: {rev.user?.name}
                  </p>
                )}
                
                <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: '1.5' }}>
                  "{rev.comment}"
                </p>
                
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '12px' }}>
                  Posted on {new Date(rev.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>No reviews found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;