import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyBusinesses, fetchCustomerFeedback, fetchMyReviews } from '../api';

const Profile = () => {
  const [reviews, setReviews] = useState([]);
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  const user = useMemo(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  }, []);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        if (user?.role === 'owner') {
          const [bizRes, feedbackRes] = await Promise.all([
            fetchMyBusinesses(),
            fetchCustomerFeedback()
          ]);
          setMyBusinesses(bizRes.data);
          setReviews(feedbackRes.data);
        } else if (user) {
          const { data } = await fetchMyReviews();
          setReviews(data);
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadProfileData();
  }, [user?._id, user?.id]);

  // Logic to filter the review list based on the owner's selection
  const filteredReviews = selectedBusiness 
    ? reviews.filter(rev => rev.business?._id === selectedBusiness)
    : reviews;

  if (!user) return <div className="empty-state">Please log in.</div>;

  return (
    <div className="dashboard-wrapper">
      <h1 className="page-title">{user.role === 'owner' ? 'Owner Dashboard' : 'My Reviews'}</h1>

      {loading ? (
        <div className="empty-state"><span className="spinner spinner-dark" /></div>
      ) : (
        <>
          {user.role === 'owner' && (
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Your Listed Businesses</h2>
                {selectedBusiness && (
                  <button 
                    onClick={() => setSelectedBusiness(null)}
                    style={{ fontSize: '0.8rem', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline' }}
                  >
                    Show all reviews
                  </button>
                )}
              </div>
              
              {myBusinesses.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {myBusinesses.map(biz => (
                    <div 
                      key={biz._id} 
                      className="form-card" 
                      onClick={() => setSelectedBusiness(biz._id === selectedBusiness ? null : biz._id)}
                      style={{ 
                        padding: '16px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: selectedBusiness === biz._id ? '2px solid var(--accent)' : '1px solid transparent'
                      }}
                    >
                      <h3 style={{ color: 'var(--accent)' }}>{biz.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{biz.category}</p>
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '0.9rem' }}>★ {biz.avgRating} ({biz.reviewCount})</span>
                         <Link 
                            to={`/business/${biz._id}`} 
                            className="view-link" 
                            style={{ fontSize: '0.8rem' , background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'none', cursor: 'pointer' }}
                            onClick={(e) => e.stopPropagation()} 
                         >
                            View Page
                         </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">You haven't listed any businesses yet.</div>
              )}
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
              {selectedBusiness ? `Reviews for Selected Business` : (user.role === 'owner' ? 'Recent Customer Feedback' : 'Your Review History')}
            </h2>
            
            {filteredReviews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(selectedBusiness ? filteredReviews : filteredReviews.slice(0, 5)).map(rev => (
                  <div key={rev._id} className="form-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '1rem', color: 'var(--accent)' }}>{rev.business?.name}</h3>
                      <span className="card-rating">★ {rev.rating}</span>
                    </div>
                    {user.role === 'owner' && <p style={{fontSize: '0.8rem', fontWeight: '600', marginTop: '4px'}}>From: {rev.user?.name}</p>}
                    <p style={{ color: 'var(--ink-soft)', marginTop: '8px' }}>"{rev.comment}"</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', marginTop: '10px' }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                {!selectedBusiness && filteredReviews.length > 5 && (
                   <p style={{ textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.85rem', marginTop: '10px' }}>
                     Showing the 5 most recent reviews. Click <strong>"View Page"</strong> on a business to see full history.
                   </p>
                )}
              </div>
            ) : (
              <div className="empty-state">No reviews found for this selection.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;