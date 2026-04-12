import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBusiness } from '../api'; 

const BusinessDetail = () => {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchBusiness(id, page)
      .then(({ data }) => {
        setBusiness(data.business); 
        setReviews(data.reviews || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setBusiness(null); 
      })
      .finally(() => setLoading(false));
  }, [id, page]);

  if (loading && page === 1) return <div className="empty-state">Loading business details...</div>;
  if (!business) return <div className="empty-state">Business not found.</div>;

  return (
    <div className="dashboard-wrapper">
      <p className="page-eyebrow">{business.category}</p>
      <h1 className="page-title">{business.name}</h1>
      
      <div className="business-meta">
        <div className="meta-item">
          <span className="star">★</span> {business.avgRating || "0"} 
          <span className="meta-count">({business.reviewCount || 0} reviews)</span>
        </div>
        <div className="meta-item address">
          <span className="icon">📍</span> {business.address}
        </div>
      </div>

      <p className="page-sub" style={{ marginTop: '20px' }}>{business.description}</p>
      
      <div className="section-header" style={{ marginTop: '40px' }}>
        <h2 className="section-title">Reviews</h2>
      </div>

      <div className="reviews-list">
        {reviews.length > 0 ? (
          reviews.map(r => (
            <div key={r._id} className="form-card" style={{ marginBottom: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '1rem' }}>{r.user?.name}</strong>
                <span className="card-rating">★ {r.rating}</span>
              </div>
              <p style={{ color: 'var(--ink-soft)', lineHeight: '1.5' }}>{r.comment}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '12px' }}>
                {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <div className="empty-state">No reviews yet. Be the first!</div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px', alignItems: 'center' }}>
          <button 
            className="btn-pagination" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="page-info">Page {page} of {totalPages}</span>
          <button 
            className="btn-pagination" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessDetail;