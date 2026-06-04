import React from 'react'
import { User, Globe, CircleDollarSign, ChevronRight, Crown } from 'lucide-react'

export default function AccountScreen({ chatMessageCount, itineraryCount }) {
  return (
    <div className="tab-view">
      {/* Profile Section matching Screen 6 */}
      <div className="account-profile-section">
        <div className="account-avatar">
          A
        </div>
        <div className="account-info">
          <div className="account-name-row">
            <h2 className="account-name">Anh Nguyen</h2>
          </div>
          <p className="account-email">anh.nguyen@gmail.com</p>
          <div className="account-badge">
            Thành viên Vinpearl 💎
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="account-stats-row">
        <div className="account-stat-item">
          <span className="account-stat-num">{itineraryCount}</span>
          <span className="account-stat-label">Lịch trình</span>
        </div>
        <div className="account-stat-item" style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
          <span className="account-stat-num">4</span>
          <span className="account-stat-label">Điểm đến</span>
        </div>
        <div className="account-stat-item">
          <span className="account-stat-num">{chatMessageCount}</span>
          <span className="account-stat-label">Tin nhắn</span>
        </div>
      </div>

      {/* VinClub Promo Banner */}
      <div className="account-promo-card">
        <div className="account-promo-left">
          <div className="account-promo-icon-wrapper">
            <Crown size={18} />
          </div>
          <div>
            <h3 className="account-promo-title">VinClub</h3>
            <p className="account-promo-subtitle">Ưu đãi đặc quyền dành riêng cho bạn</p>
          </div>
        </div>
        <button className="account-promo-btn" onClick={() => alert('Chức năng VinClub đang được cập nhật!')}>
          Xem
        </button>
      </div>

      {/* Options List */}
      <div className="account-options-list">
        <div className="account-option-item" onClick={() => alert('Thông tin cá nhân')}>
          <div className="account-option-left">
            <User size={18} className="account-option-icon" />
            <span>Thông tin cá nhân</span>
          </div>
          <ChevronRight size={16} className="account-option-arrow" />
        </div>

        <div className="account-option-item" onClick={() => alert('Thông tin ưu đãi VinClub')}>
          <div className="account-option-left">
            <Crown size={18} className="account-option-icon" style={{ color: '#d97706' }} />
            <span>VinClub</span>
          </div>
          <ChevronRight size={16} className="account-option-arrow" />
        </div>

        <div className="account-option-item">
          <div className="account-option-left">
            <Globe size={18} className="account-option-icon" />
            <span>Ngôn ngữ</span>
          </div>
          <div className="account-option-right">
            <span>Tiếng Việt</span>
            <ChevronRight size={16} className="account-option-arrow" />
          </div>
        </div>

        <div className="account-option-item">
          <div className="account-option-left">
            <CircleDollarSign size={18} className="account-option-icon" />
            <span>Tiền tệ</span>
          </div>
          <div className="account-option-right">
            <span>VND (đ)</span>
            <ChevronRight size={16} className="account-option-arrow" />
          </div>
        </div>
      </div>
    </div>
  )
}
