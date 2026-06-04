import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Globe, ArrowRight, Search, Star } from 'lucide-react'

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

// Browser mock websites database
const mockWebPages = {
  google: {
    url: 'https://google.com',
    title: 'Google Search'
  },
  homepage: {
    url: 'https://vinpearl.com/vi',
    title: 'Vinpearl - Hệ thống Khách sạn & Resort 5 sao'
  },
  phu_quoc: {
    url: 'https://vinpearl.com/vi/vinpearl-phu-quoc',
    title: 'Vinpearl Phú Quốc - Thiên Đường Nghỉ Dưỡng'
  },
  nha_trang: {
    url: 'https://vinpearl.com/vi/vinpearl-nha-trang',
    title: 'Vinpearl Nha Trang - Đảo Ngọc Rực Rỡ'
  },
  hoi_an: {
    url: 'https://vinpearl.com/vi/vinpearl-nam-hoi-an',
    title: 'Vinpearl Nam Hội An - Giao Thoa Di Sản'
  },
  ha_long: {
    url: 'https://vinpearl.com/vi/vinpearl-ha-long',
    title: 'Vinpearl Hạ Long - Lâu Đài Giữa Kỳ Quan'
  }
};

export default function ExploreScreen({ onSelectDestination }) {
  // Navigation stack state starting from the official Vinpearl Portal
  const [history, setHistory] = useState(['https://vinpearl.com/vi'])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [urlInput, setUrlInput] = useState('https://vinpearl.com/vi')
  const [googleSearchQuery, setGoogleSearchQuery] = useState('')

  const currentUrl = history[historyIndex] || 'https://vinpearl.com/vi'

  useEffect(() => {
    setUrlInput(currentUrl)
  }, [currentUrl])

  const navigateTo = (newUrl) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }

  const handleGoBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  }

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  }

  const handleRefresh = () => {
    const current = urlInput;
    setUrlInput('');
    setTimeout(() => setUrlInput(current), 50);
  }

  const handleUrlSubmit = (e) => {
    if (e.key === 'Enter') {
      let url = urlInput.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      navigateTo(url);
    }
  }

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (googleSearchQuery.trim()) {
        navigateTo(`https://google.com/search?q=${encodeURIComponent(googleSearchQuery)}`);
      }
    }
  }

  // Determine which page template to render
  const renderBrowserContent = () => {
    const urlLower = currentUrl.toLowerCase();

    // 1. MOCK VINPEARL OFFICIAL HOMEPAGE PORTAL (https://vinpearl.com/vi)
    if (urlLower === 'https://vinpearl.com/vi' || urlLower === 'https://vinpearl.com/vi/' || urlLower === 'vinpearl.com/vi') {
      return (
        <div className="browser-page resort-portal">
          {/* Main Hero Slider */}
          <div className="portal-hero" style={{ height: '180px' }}>
            <img src="/images/phu_quoc.png" alt="Vinpearl Hero" />
            <div className="portal-hero-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 100%)' }}>
              <span className="portal-badge" style={{ background: '#d97706' }}>Official Website</span>
              <h2>Vinpearl</h2>
              <p>Hệ thống Nghỉ dưỡng, Vui chơi giải trí & Golf hàng đầu Việt Nam</p>
            </div>
          </div>

          <div className="portal-body">
            {/* Mock Booking Quick search form */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              marginTop: '-30px',
              position: 'relative',
              zIndex: 5,
              border: '1px solid #e2e8f0',
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tìm kiếm ưu đãi đặt phòng
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ fontSize: '8px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Bạn muốn đi đâu?</label>
                  <select 
                    style={{ width: '100%', fontSize: '11px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#334155' }}
                    onChange={(e) => {
                      if (e.target.value) navigateTo(`https://vinpearl.com/vi/vinpearl-${e.target.value}`);
                    }}
                  >
                    <option value="">Chọn điểm đến...</option>
                    <option value="phu-quoc">Vinpearl Phú Quốc</option>
                    <option value="nha-trang">Vinpearl Nha Trang</option>
                    <option value="nam-hoi-an">Vinpearl Nam Hội An</option>
                    <option value="ha-long">Vinpearl Hạ Long</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '8px', color: '#64748b', display: 'block', marginBottom: '2px' }}>Số lượng khách</label>
                  <input type="text" value="2 người lớn, 2 trẻ em" readOnly style={{ width: '100%', fontSize: '11px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#334155' }} />
                </div>
              </div>
              <button 
                onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-phu-quoc')}
                style={{ width: '100%', background: '#d97706', color: '#ffffff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                TÌM KIẾM PHÒNG TRỐNG
              </button>
            </div>

            {/* Destinations grid list */}
            <div className="portal-section">
              <h3>Khám phá các Quần thể nghỉ dưỡng</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { id: 'phu-quoc', name: 'Phú Quốc', img: '/images/phu_quoc.png', badge: 'Phòng từ 2.45m' },
                  { id: 'nha-trang', name: 'Nha Trang', img: '/images/nha_trang.png', badge: 'Phòng từ 2.2m' },
                  { id: 'nam-hoi-an', name: 'Nam Hội An', img: '/images/hoi_an.png', badge: 'Phòng từ 2.1m' },
                  { id: 'ha-long', name: 'Hạ Long', img: '/images/ha_long.png', badge: 'Phòng từ 2.6m' }
                ].map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => navigateTo(`https://vinpearl.com/vi/vinpearl-${item.id}`)}
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ height: '70px', position: 'relative' }}>
                      <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#7c3aed', color: '#ffffff', fontSize: '8px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {item.badge}
                      </span>
                    </div>
                    <div style={{ padding: '8px', textAlign: 'center' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Vinpearl {item.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick promotions banner */}
            <div style={{
              background: 'linear-gradient(135deg, #ede9fe 0%, #fae8ff 100%)',
              borderRadius: '12px',
              padding: '12px',
              marginTop: '10px',
              border: '1px solid #d8b4fe'
            }}>
              <span style={{ background: '#7c3aed', color: '#ffffff', fontSize: '8px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Ưu đãi Hot
              </span>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#4c1d95', margin: '4px 0 2px 0' }}>Combo Mùa Hè Rực Rỡ 3N2Đ</h4>
              <p style={{ fontSize: '10px', color: '#6b21a8', margin: 0 }}>Bao gồm vé bay khứ hồi Vietjet + 2 đêm nghỉ + buffet sáng + vé vui chơi VinWonders. Chỉ từ 4.590.000đ/khách.</p>
            </div>
          </div>
        </div>
      );
    }

    // 2. MOCK GOOGLE SEARCH RESULTS PAGE
    if (urlLower.includes('google.com/search') || urlLower.includes('google.com')) {
      return (
        <div className="browser-page google-search">
          <div className="google-header">
            <span className="google-logo"><span style={{color: '#4285F4'}}>G</span><span style={{color: '#EA4335'}}>o</span><span style={{color: '#FBBC05'}}>o</span><span style={{color: '#4285F4'}}>g</span><span style={{color: '#34A853'}}>l</span><span style={{color: '#EA4335'}}>e</span></span>
            <div className="google-search-bar-mini">
              <input
                type="text"
                value={googleSearchQuery}
                onChange={(e) => setGoogleSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
              />
              <Search size={14} onClick={handleSearchSubmit} />
            </div>
          </div>

          <div className="google-results">
            <div className="google-result-item">
              <span className="result-url">https://vinpearl.com &gt; vi &gt; resorts</span>
              <h3 className="result-link" onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-phu-quoc')}>
                Vinpearl Phú Quốc - Đặt phòng Khách sạn & Resort 5 sao giá tốt nhất
              </h3>
              <p className="result-snippet">
                Khám phá hệ thống resort nghỉ dưỡng Vinpearl Phú Quốc tại Bãi Dài. Ưu đãi vé vui chơi VinWonders, tham quan Safari và xem show Grand World đỉnh cao.
              </p>
            </div>

            <div className="google-result-item">
              <span className="result-url">https://vinpearl.com &gt; vi &gt; nha-trang</span>
              <h3 className="result-link" onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-nha-trang')}>
                Ninh Vân Bay & Đảo Hòn Tre - Vinpearl Nha Trang Resort & Spa
              </h3>
              <p className="result-snippet">
                Đặt phòng biệt thự biển Vinpearl Nha Trang hướng biển trọn vẹn. Trải nghiệm hệ thống cáp treo vượt vịnh biển và Tata Show hoành tráng hàng đêm.
              </p>
            </div>

            <div className="google-result-item">
              <span className="result-url">https://vinpearl.com &gt; vi &gt; nam-hoi-an</span>
              <h3 className="result-link" onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-nam-hoi-an')}>
                Vinpearl Nam Hội An - Khu Nghỉ Dưỡng Di Sản Bên Bờ Biển Bình Minh
              </h3>
              <p className="result-snippet">
                Kết hợp trải nghiệm nét cổ kính di sản của phố cổ Hội An và vui chơi công viên văn hóa, đi thuyền khám phá River Safari trên sông duy nhất tại Việt Nam.
              </p>
            </div>

            <div className="google-result-item">
              <span className="result-url">https://vinpearl.com &gt; vi &gt; ha-long</span>
              <h3 className="result-link" onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-ha-long')}>
                Khách sạn Lâu Đài Đảo Rều - Vinpearl Resort Hạ Long
              </h3>
              <p className="result-snippet">
                Khu nghỉ dưỡng 4 mặt giáp biển đẳng cấp hoàng gia Pháp. Chiêm ngưỡng trọn vẹn kỳ quan vịnh Hạ Long từ ban công phòng nghỉ đảo riêng Đảo Rều.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // 3. MOCK VINPEARL PHU QUOC PORTAL
    if (urlLower.includes('phu-quoc') || urlLower.includes('phu_quoc')) {
      return (
        <div className="browser-page resort-portal">
          <div className="portal-hero">
            <img src="/images/phu_quoc.png" alt="Phú Quốc" />
            <div className="portal-hero-overlay">
              <span className="portal-badge">Hot Resort</span>
              <h2>Vinpearl Phú Quốc</h2>
              <p>Bãi Dài, Gành Dầu, Phú Quốc, Kiên Giang</p>
            </div>
          </div>

          <div className="portal-body">
            <div className="portal-section">
              <h3>Về khu nghỉ dưỡng</h3>
              <p className="portal-desc">
                Hệ thống biệt thự biển và khách sạn 5 sao mang phong cách tân cổ điển tráng lệ. Nằm dọc bãi biển Bãi Dài - một trong những bãi biển đẹp nhất hành tinh. Sát vách công viên chủ đề VinWonders và vườn thú Safari.
              </p>
            </div>

            <div className="portal-section">
              <h3>Bảng giá phòng & Dịch vụ (Mock Data)</h3>
              <div className="portal-price-list">
                <div className="price-row">
                  <span>Deluxe Ocean View Room</span>
                  <strong>2.450.000 đ/đêm</strong>
                </div>
                <div className="price-row">
                  <span>Executive Suite Family Room</span>
                  <strong>3.800.000 đ/đêm</strong>
                </div>
                <div className="price-row">
                  <span>3-Bedroom Beachfront Villa (Hồ bơi riêng)</span>
                  <strong>8.500.000 đ/đêm</strong>
                </div>
              </div>
            </div>

            <button className="portal-ai-trigger" onClick={() => onSelectDestination('phu_quoc')}>
              Xem chi tiết Resort & Bản đồ Google <ArrowRight size={14} />
            </button>
          </div>
        </div>
      );
    }

    // 4. MOCK VINPEARL NHA TRANG PORTAL
    if (urlLower.includes('nha-trang') || urlLower.includes('nha_trang')) {
      return (
        <div className="browser-page resort-portal">
          <div className="portal-hero">
            <img src="/images/nha_trang.png" alt="Nha Trang" />
            <div className="portal-hero-overlay">
              <span className="portal-badge" style={{background: '#0ea5e9'}}>Popular Island</span>
              <h2>Vinpearl Nha Trang</h2>
              <p>Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang, Khánh Hòa</p>
            </div>
          </div>

          <div className="portal-body">
            <div className="portal-section">
              <h3>Khám phá thiên đường đảo Hòn Tre</h3>
              <p className="portal-desc">
                Hòa mình vào làn nước xanh lục bảo của vịnh biển Nha Trang. Trải nghiệm hệ thống biệt thự nghỉ dưỡng, công viên giải trí kỷ lục VinWonders Nha Trang, sân golf đẳng cấp quốc tế 18 hố.
              </p>
            </div>

            <div className="portal-section">
              <h3>Hạng phòng & Báo giá</h3>
              <div className="portal-price-list">
                <div className="price-row">
                  <span>Deluxe Hill View Room</span>
                  <strong>2.200.000 đ/đêm</strong>
                </div>
                <div className="price-row">
                  <span>Grand Deluxe Ocean Room</span>
                  <strong>2.950.000 đ/đêm</strong>
                </div>
                <div className="price-row">
                  <span>Ocean View Private Pool Villa</span>
                  <strong>6.900.000 đ/đêm</strong>
                </div>
              </div>
            </div>

            <button className="portal-ai-trigger" style={{background: '#0ea5e9'}} onClick={() => onSelectDestination('nha_trang')}>
              Xem chi tiết Resort & Bản đồ Google <ArrowRight size={14} />
            </button>
          </div>
        </div>
      );
    }

    // 5. MOCK VINPEARL NAM HOI AN PORTAL
    if (urlLower.includes('nam-hoi-an') || urlLower.includes('hoi-an') || urlLower.includes('hoi_an')) {
      return (
        <div className="browser-page resort-portal">
          <div className="portal-hero">
            <img src="/images/hoi_an.png" alt="Nam Hội An" />
            <div className="portal-hero-overlay">
              <span className="portal-badge" style={{background: '#d97706'}}>Heritage Culture</span>
              <h2>Vinpearl Nam Hội An</h2>
              <p>Đường Thanh Niên, Bình Minh, Thăng Bình, Quảng Nam</p>
            </div>
          </div>

          <div className="portal-body">
            <div className="portal-section">
              <h3>Hội tụ văn hóa di sản và hiện đại</h3>
              <p className="portal-desc">
                Sở hữu kiến trúc giao thoa độc đáo, kết nối di sản văn hóa truyền thức Việt Nam tại Đảo văn hóa dân gian và khu Safari vườn thú trên sông độc bản River Safari.
              </p>
            </div>

            <div className="portal-section">
              <h3>Báo giá phòng</h3>
              <div className="portal-price-list">
                <div className="price-row">
                  <span>Deluxe Room (Twin/King)</span>
                  <strong>2.100.000 đ/đêm</strong>
                </div>
                <div className="price-row">
                  <span>Executive Villa Suite (2 phòng ngủ)</span>
                  <strong>5.200.000 đ/đêm</strong>
                </div>
              </div>
            </div>

            <button className="portal-ai-trigger" style={{background: '#d97706'}} onClick={() => onSelectDestination('hoi_an')}>
              Xem chi tiết Resort & Bản đồ Google <ArrowRight size={14} />
            </button>
          </div>
        </div>
      );
    }

    // 6. MOCK VINPEARL HA LONG PORTAL
    if (urlLower.includes('ha-long') || urlLower.includes('ha_long')) {
      return (
        <div className="browser-page resort-portal">
          <div className="portal-hero">
            <img src="/images/ha_long.png" alt="Hạ Long" />
            <div className="portal-hero-overlay">
              <span className="portal-badge" style={{background: '#10b981'}}>Majestic View</span>
              <h2>Vinpearl Hạ Long</h2>
              <p>Đảo Rều, Bãi Cháy, Hạ Long, Quảng Ninh</p>
            </div>
          </div>

          <div className="portal-body">
            <div className="portal-section">
              <h3>Lâu đài giữa kỳ quan thế giới</h3>
              <p className="portal-desc">
                Nằm hoàn toàn biệt lập trên đảo Rều xinh đẹp, mang phong cách kiến trúc Pháp cổ điển tráng lệ. Nơi ngắm bình minh và hoàng hôn đẹp nhất Hạ Long.
              </p>
            </div>

            <div className="portal-section">
              <h3>Hạng phòng & Báo giá</h3>
              <div className="portal-price-list">
                <div className="price-row">
                  <span>Deluxe View Vịnh Hạ Long</span>
                  <strong>2.600.000 đ/đêm</strong>
                </div>
                <div className="price-row">
                  <span>Panoramic Ocean Suite</span>
                  <strong>4.300.000 đ/đêm</strong>
                </div>
              </div>
            </div>

            <button className="portal-ai-trigger" style={{background: '#10b981'}} onClick={() => onSelectDestination('ha_long')}>
              Xem chi tiết Resort & Bản đồ Google <ArrowRight size={14} />
            </button>
          </div>
        </div>
      );
    }

    // 7. GENERAL DEFAULT BLOG SITE
    return (
      <div className="browser-page general-travel-blog">
        <div className="blog-header">
          <h2>Bí Kíp Đi Vinpearl 2026</h2>
          <p>Cổng chia sẻ cẩm nang du lịch và đặt phòng thông minh cùng AI</p>
        </div>
        <div className="blog-content">
          <div className="blog-post">
            <h3>Top 4 Điểm Đến Vinpearl Gia Đình Nhất Định Phải Ghé</h3>
            <p>
              Hệ thống quần thể nghỉ dưỡng Vinpearl trải dài từ miền Bắc đến miền Nam đem đến dịch vụ lưu trú 5 sao, vui chơi giải trí kỷ lục và các show diễn thực cảnh ấn tượng...
            </p>
            <div className="blog-links">
              <button onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-phu-quoc')}>1. Vinpearl Phú Quốc ➔</button>
              <button onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-nha-trang')}>2. Vinpearl Nha Trang ➔</button>
              <button onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-nam-hoi-an')}>3. Vinpearl Nam Hội An ➔</button>
              <button onClick={() => navigateTo('https://vinpearl.com/vi/vinpearl-ha-long')}>4. Vinpearl Hạ Long ➔</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tab-view browser-shell">
      {/* Browser top navbar header */}
      <div className="browser-header">
        <div className="browser-actions">
          <button className="browser-nav-btn" onClick={handleGoBack} disabled={historyIndex === 0}>
            <ChevronLeft size={16} />
          </button>
          <button className="browser-nav-btn" onClick={handleGoForward} disabled={historyIndex === history.length - 1}>
            <ChevronRight size={16} />
          </button>
          <button className="browser-nav-btn" onClick={handleRefresh}>
            <RotateCw size={14} />
          </button>
        </div>

        <div className="browser-url-bar">
          <Globe size={12} className="url-globe-icon" />
          <input
            type="text"
            className="browser-url-input"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlSubmit}
          />
        </div>
      </div>

      {/* Browser Viewport Area */}
      <div className="browser-viewport">
        {renderBrowserContent()}
      </div>
    </div>
  )
}
