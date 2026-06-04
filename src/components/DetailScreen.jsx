import React from 'react'
import { ArrowLeft, Heart, Share2, MapPin, Star, Check } from 'lucide-react'

export default function DetailScreen({ destination, onClose, onGenerateItinerary, setActiveTab }) {
  if (!destination) return null

  return (
    <div className="detail-screen-overlay">
      {/* Floating header overlaying hero image */}
      <div className="detail-header">
        <button className="detail-header-btn" onClick={onClose}>
          <ArrowLeft size={18} />
        </button>
        <div className="detail-header-right">
          <button className="detail-header-btn">
            <Heart size={18} />
          </button>
          <button className="detail-header-btn">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Main scrollable body */}
      <div className="detail-scrollable">
        <div className="detail-hero-section">
          <img src={destination.image} alt={destination.name} className="detail-hero-img" />
          <span className="detail-img-badge">1/12</span>
        </div>

        {/* Content overlap card */}
        <div className="detail-content-box">
          <h1 className="detail-title">{destination.name}</h1>
          
          <div className="detail-location-row">
            <MapPin size={14} className="detail-location-icon" />
            <span>{destination.location}</span>
          </div>

          <div className="detail-rating-row">
            <Star size={14} className="star-icon" />
            <span className="detail-rating-number">{destination.rating}</span>
            <span className="detail-rating-label">Rất tốt</span>
            <span className="detail-rating-count">({destination.ratingCount})</span>
          </div>

          <p className="detail-desc">{destination.desc}</p>

          {/* Icon Features Grid */}
          <div className="detail-features-grid">
            {destination.features.map((feat, idx) => (
              <div key={idx} className="detail-feature-item">
                <span className="detail-feature-icon-wrapper" style={{ fontSize: '18px' }}>
                  {feat.icon}
                </span>
                <span className="detail-feature-label">{feat.label}</span>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div className="detail-highlights-section">
            <h2 className="detail-highlights-title">Điểm nổi bật</h2>
            <ul className="detail-highlights-list">
              {destination.highlights.map((high, idx) => (
                <li key={idx} className="detail-highlight-item">
                  <span className="detail-highlight-check">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>{high}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="detail-bottom-actions">
        <button
          className="detail-btn secondary"
          onClick={() => {
            onGenerateItinerary(destination.id)
            onClose()
            setActiveTab('itinerary')
          }}
        >
          Tạo lịch trình
        </button>
        <button className="detail-btn primary">
          Xem resort
        </button>
      </div>
    </div>
  )
}
