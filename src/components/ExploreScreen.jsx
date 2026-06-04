import React, { useState } from 'react'
import { Search, SlidersHorizontal, Star } from 'lucide-react'

// Array of destinations corresponding to Screen 5
export const destinationsData = [
  {
    id: 'phu_quoc',
    name: 'Vinpearl Phú Quốc',
    location: 'Bãi Dài, Gành Dầu, Phú Quốc, Kiên Giang',
    rating: 4.8,
    ratingCount: '1.234 đánh giá',
    image: '/images/phu_quoc.png',
    desc: 'Khu nghỉ dưỡng 5 sao bên bãi biển Bãi Dài thơ mộng, thiên đường nghỉ dưỡng cho gia đình.',
    highlights: [
      'Hệ thống phòng dành cho gia đình',
      'VinWonders Phú Quốc ngay bên cạnh',
      'Safari bán hoang dã độc đáo',
      'Nhiều hoạt động cho trẻ em'
    ],
    features: [
      { label: 'Resort 5 sao', icon: '🏨' },
      { label: 'Bãi biển riêng', icon: '🏖️' },
      { label: 'VinWonders', icon: '🎡' },
      { label: 'Vinpearl Safari', icon: '🦁' }
    ]
  },
  {
    id: 'nha_trang',
    name: 'Vinpearl Nha Trang',
    location: 'Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang, Khánh Hòa',
    rating: 4.7,
    ratingCount: '986 đánh giá',
    image: '/images/nha_trang.png',
    desc: 'Khu du lịch phức hợp hàng đầu nằm trên đảo Hòn Tre xinh đẹp, kết nối bằng cáp treo vượt biển.',
    highlights: [
      'Cáp treo vượt biển dài bậc nhất thế giới',
      'Công viên giải trí VinWonders Nha Trang rộng lớn',
      'Sân golf 18 hố tiêu chuẩn quốc tế',
      'Bãi biển cát trắng mịn dài vô tận'
    ],
    features: [
      { label: 'Vịnh biển đẹp', icon: '🌊' },
      { label: 'Cáp treo đảo', icon: '🚡' },
      { label: 'Sân Golf 18 hố', icon: '⛳' },
      { label: 'Hồ bơi cực đại', icon: '🏊' }
    ]
  },
  {
    id: 'hoi_an',
    name: 'Vinpearl Nam Hội An',
    location: 'Đường Thanh Niên, Bình Minh, Thăng Bình, Quảng Nam',
    rating: 4.6,
    ratingCount: '812 đánh giá',
    image: '/images/hoi_an.png',
    desc: 'Thiết kế độc đáo hòa quyện nét di sản kiến trúc Hội An cổ kính và phong cách đương đại sang trọng.',
    highlights: [
      'Bể bơi tràn bờ hình vỏ sò khổng lồ',
      'VinWonders Nam Hội An tôn vinh giá trị văn hóa',
      'Sân golf 18 hố ven bờ biển hoang sơ',
      'Khu nông nghiệp công nghệ cao VinEco'
    ],
    features: [
      { label: 'Thiết kế di sản', icon: '🏮' },
      { label: 'Công viên văn hóa', icon: '🎭' },
      { label: 'River Safari', icon: '🛶' },
      { label: 'Bể bơi vỏ sò', icon: '🐚' }
    ]
  },
  {
    id: 'ha_long',
    name: 'Vinpearl Hạ Long',
    location: 'Đảo Rều, Bãi Cháy, Hạ Long, Quảng Ninh',
    rating: 4.7,
    ratingCount: '1.050 đánh giá',
    image: '/images/ha_long.png',
    desc: 'Lâu đài nghỉ dưỡng tráng lệ nổi bật giữa làn nước ngọc lục bảo của vịnh kỳ quan thiên nhiên thế giới.',
    highlights: [
      'Vị trí độc bản 4 mặt giáp biển trên Đảo Rều',
      'Lối kiến trúc tân cổ điển hoàng gia Pháp',
      '3 bãi tắm nhân tạo bao quanh resort',
      'Góc nhìn 360 độ ngắm trọn kỳ quan vịnh Hạ Long'
    ],
    features: [
      { label: 'Đảo tư nhân', icon: '🏝️' },
      { label: 'Kiến trúc Pháp', icon: '🏰' },
      { label: '3 bãi tắm riêng', icon: '🏖️' },
      { label: 'Góc nhìn vịnh', icon: '🌅' }
    ]
  }
];

export const categoriesData = [
  { id: 'all', label: 'Tất cả', image: '' },
  { id: 'phu_quoc', label: 'Phú Quốc', image: '/images/phu_quoc.png' },
  { id: 'nha_trang', label: 'Nha Trang', image: '/images/nha_trang.png' },
  { id: 'hoi_an', label: 'Hội An', image: '/images/hoi_an.png' },
  { id: 'ha_long', label: 'Hạ Long', image: '/images/ha_long.png' }
];

export default function ExploreScreen({ onSelectDestination }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDestinations = destinationsData.filter(dest => {
    const matchesSearch = dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          dest.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || dest.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="tab-view">
      <div className="explore-header">
        <div className="search-container">
          <Search size={18} className="search-icon" style={{ color: '#7c3aed' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm điểm đến, resort, dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="filter-btn">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal categories list */}
      <div className="categories-container">
        {categoriesData.map(cat => (
          <button
            key={cat.id}
            className={`category-chip ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <div className="category-icon">
              {cat.image ? (
                <img src={cat.image} alt={cat.label} />
              ) : (
                <div className="category-icon-fallback">✨</div>
              )}
            </div>
            <span className="category-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Destination Grid */}
      <div className="destinations-section">
        <h2 className="section-title">Điểm đến nổi bật</h2>
        <div className="destinations-grid">
          {filteredDestinations.map(dest => (
            <div
              key={dest.id}
              className="dest-card"
              onClick={() => onSelectDestination(dest.id)}
            >
              <div className="dest-card-img-wrapper">
                <img src={dest.image} alt={dest.name} className="dest-card-img" />
              </div>
              <div className="dest-card-content">
                <h3 className="dest-card-title">{dest.name}</h3>
                <p className="dest-card-location">{dest.location.split(', ').slice(-2).join(', ')}</p>
                <div className="dest-card-meta">
                  <span className="dest-card-rating">
                    <Star size={12} className="star-icon" />
                    {dest.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredDestinations.length === 0 && (
            <p style={{ gridColumn: 'span 2', textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>
              Không tìm thấy điểm đến phù hợp.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
