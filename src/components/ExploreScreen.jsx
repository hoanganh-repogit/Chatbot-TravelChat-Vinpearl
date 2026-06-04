import React, { useState, useEffect } from 'react'
import { MapPin, Star, ChevronRight, Search, Filter } from 'lucide-react'

// Destination metadata for map/itinerary - kept for compatibility
export const destinationsData = [
  {
    id: 'phu_quoc',
    name: 'Vinpearl Phú Quốc',
    location: 'Bãi Dài, Gành Dầu, Phú Quốc, Kiên Giang',
    rating: 4.8, ratingCount: '1.234 đánh giá',
    image: '/images/phu_quoc.png',
    desc: 'Khu nghỉ dưỡng 5 sao bên bãi biển Bãi Dài thơ mộng, thiên đường nghỉ dưỡng cho gia đình.',
    mapLat: 10.3333, mapLng: 103.8333,
    highlights: ['Hệ thống phòng dành cho gia đình', 'VinWonders Phú Quốc ngay bên cạnh', 'Safari bán hoang dã độc đáo', 'Nhiều hoạt động cho trẻ em'],
    features: [{ label: 'Resort 5 sao', icon: '🏨' }, { label: 'Bãi biển riêng', icon: '🏖️' }, { label: 'VinWonders', icon: '🎡' }, { label: 'Vinpearl Safari', icon: '🦁' }]
  },
  {
    id: 'nha_trang',
    name: 'Vinpearl Nha Trang',
    location: 'Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang, Khánh Hòa',
    rating: 4.7, ratingCount: '986 đánh giá',
    image: '/images/nha_trang.png',
    desc: 'Khu du lịch phức hợp hàng đầu nằm trên đảo Hòn Tre xinh đẹp.',
    mapLat: 12.2388, mapLng: 109.1967,
    highlights: ['Cáp treo vượt biển dài bậc nhất thế giới', 'VinWonders Nha Trang rộng lớn', 'Sân golf 18 hố tiêu chuẩn quốc tế', 'Bãi biển cát trắng mịn'],
    features: [{ label: 'Vịnh biển đẹp', icon: '🌊' }, { label: 'Cáp treo đảo', icon: '🚡' }, { label: 'Sân Golf 18 hố', icon: '⛳' }, { label: 'Hồ bơi cực đại', icon: '🏊' }]
  },
  {
    id: 'hoi_an',
    name: 'Vinpearl Nam Hội An',
    location: 'Đường Thanh Niên, Bình Minh, Thăng Bình, Quảng Nam',
    rating: 4.6, ratingCount: '812 đánh giá',
    image: '/images/hoi_an.png',
    desc: 'Thiết kế độc đáo hòa quyện nét di sản kiến trúc Hội An cổ kính.',
    mapLat: 15.8801, mapLng: 108.3380,
    highlights: ['Bể bơi tràn bờ hình vỏ sò khổng lồ', 'VinWonders Nam Hội An', 'Sân golf 18 hố ven bờ biển', 'Khu nông nghiệp VinEco'],
    features: [{ label: 'Thiết kế di sản', icon: '🏮' }, { label: 'Công viên văn hóa', icon: '🎭' }, { label: 'River Safari', icon: '🛶' }, { label: 'Bể bơi vỏ sò', icon: '🐚' }]
  },
  {
    id: 'ha_long',
    name: 'Vinpearl Hạ Long',
    location: 'Đảo Rều, Bãi Cháy, Hạ Long, Quảng Ninh',
    rating: 4.7, ratingCount: '1.050 đánh giá',
    image: '/images/ha_long.png',
    desc: 'Lâu đài nghỉ dưỡng tráng lệ nổi bật giữa làn nước ngọc lục bảo của vịnh kỳ quan.',
    mapLat: 20.9101, mapLng: 107.1839,
    highlights: ['Vị trí độc bản 4 mặt giáp biển', 'Lối kiến trúc tân cổ điển hoàng gia Pháp', '3 bãi tắm nhân tạo', 'Góc nhìn 360 độ vịnh Hạ Long'],
    features: [{ label: 'Đảo tư nhân', icon: '🏝️' }, { label: 'Kiến trúc Pháp', icon: '🏰' }, { label: '3 bãi tắm riêng', icon: '🏖️' }, { label: 'Góc nhìn vịnh', icon: '🌅' }]
  }
]

// Map slug → destination id
const slugToDestId = {
  'vinpearl-resort-spa-phu-quoc': 'phu_quoc',
  'vinpearl-wonderworld-phu-quoc': 'phu_quoc',
  'vinholidays-fiesta-phu-quoc': 'phu_quoc',
  'vinpearl-resort-spa-ha-long': 'ha_long',
  'vinpearl-resort-nha-trang': 'nha_trang',
  'vinpearl-luxury-nha-trang': 'nha_trang',
  'vinpearl-beachfront-nha-trang': 'nha_trang',
  'vinpearl-condotel-beachfront-nha-trang': 'nha_trang',
  'vinpearl-empire-nha-trang-affiliated-by-melia': 'nha_trang',
  'vinpearl-resort-spa-nha-trang-bay': 'nha_trang',
  'hon-tam-resort': 'nha_trang',
  'vinpearl-resort-golf-nam-hoi-an': 'hoi_an',
  'vinpearl-cua-hoi-resort-affiliated-by-melia': 'hoi_an',
  'vinpearl-cua-sot-resort-affiliated-by-melia': 'hoi_an',
  'vinpearl-ha-tinh-affiliated-by-melia': 'hoi_an',
  'vinpearl-hotel-bac-ninh': 'ha_long',
}

const regionLabel = { phu_quoc: 'Phú Quốc', nha_trang: 'Nha Trang', hoi_an: 'Hội An', ha_long: 'Hạ Long' }
const regionColor = { phu_quoc: '#7c3aed', nha_trang: '#0ea5e9', hoi_an: '#d97706', ha_long: '#10b981' }

export default function ExploreScreen({ onSelectDestination }) {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    fetch('/data-mooc/hotels_clean.json')
      .then(r => r.json())
      .then(data => { setHotels(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const getRegion = (hotel) => slugToDestId[hotel.slug] || 'phu_quoc'

  const filtered = hotels.filter(h => {
    const region = getRegion(h)
    if (selectedRegion !== 'all' && region !== selectedRegion) return false
    if (searchQuery && !h.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !h.location.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getHotelImage = (hotel) => {
    // Prefer local images, fallback to remote
    if (hotel.local_images && hotel.local_images.length > 0) {
      return '/' + hotel.local_images[0]
    }
    if (hotel.images && hotel.images.length > 0) {
      // pick first jpg/png not svg/icon
      const img = hotel.images.find(i => /\.(jpg|jpeg|png|webp)/.test(i.toLowerCase()) && !i.includes('icon') && !i.includes('logo') && !i.includes('svg'))
      return img || hotel.images[0]
    }
    return '/images/phu_quoc.png'
  }

  const getMinPrice = (hotel) => {
    const prices = (hotel.room_types || []).map(r => r.price_from_usd).filter(Boolean)
    if (prices.length === 0) return null
    return Math.min(...prices)
  }

  if (loading) return (
    <div className="tab-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#7c3aed' }}>
        <div className="typing-dot" style={{ display: 'inline-block', background: '#7c3aed', width: 8, height: 8, borderRadius: '50%', margin: '0 3px' }} />
        <div className="typing-dot" style={{ display: 'inline-block', background: '#7c3aed', width: 8, height: 8, borderRadius: '50%', margin: '0 3px' }} />
        <div className="typing-dot" style={{ display: 'inline-block', background: '#7c3aed', width: 8, height: 8, borderRadius: '50%', margin: '0 3px' }} />
        <p style={{ marginTop: 12, fontSize: 13 }}>Đang tải dữ liệu resort...</p>
      </div>
    </div>
  )

  // Hotel detail view
  if (selectedHotel) {
    const region = getRegion(selectedHotel)
    const destData = destinationsData.find(d => d.id === region)
    const images = selectedHotel.local_images
      ? selectedHotel.local_images.slice(0, 8).map(i => '/' + i)
      : (selectedHotel.images || []).filter(i => /\.(jpg|jpeg|png|webp)/.test(i.toLowerCase())).slice(0, 8)
    const minPrice = getMinPrice(selectedHotel)

    return (
      <div className="tab-view" style={{ overflowY: 'auto' }}>
        {/* Back + Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f1f5f9' }}>
          <button onClick={() => { setSelectedHotel(null); setActiveImageIndex(0) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontWeight: 700, fontSize: 20, lineHeight: 1 }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{selectedHotel.name}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{selectedHotel.location}</div>
          </div>
          <span style={{ background: regionColor[region], color: '#fff', fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>{regionLabel[region]}</span>
        </div>

        {/* Image gallery */}
        <div style={{ position: 'relative', height: 200 }}>
          <img
            src={images[activeImageIndex] || getHotelImage(selectedHotel)}
            alt={selectedHotel.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.src = '/images/phu_quoc.png' }}
          />
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
            {images.slice(0, 6).map((_, i) => (
              <div key={i} onClick={() => setActiveImageIndex(i)} style={{ width: i === activeImageIndex ? 16 : 6, height: 6, borderRadius: 3, background: i === activeImageIndex ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.2s' }} />
            ))}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto' }}>
          {images.slice(0, 8).map((img, i) => (
            <img key={i} src={img} alt="" onClick={() => setActiveImageIndex(i)}
              style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: i === activeImageIndex ? '2px solid #7c3aed' : '2px solid transparent', cursor: 'pointer' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          ))}
        </div>

        <div style={{ padding: '0 16px 24px' }}>
          {/* Price + rating */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0' }}>
            <div>
              {minPrice && <div style={{ fontSize: 18, fontWeight: 800, color: '#7c3aed' }}>từ ${minPrice}<span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>/đêm</span></div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{destData?.rating || 4.7}</span>
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>{selectedHotel.description}</p>

          {/* Google Maps embed */}
          {destData && (
            <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ background: '#f8fafc', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #e2e8f0' }}>
                <MapPin size={13} color="#7c3aed" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>Vị trí trên bản đồ</span>
              </div>
              <iframe
                title="map"
                width="100%"
                height="160"
                style={{ border: 'none', display: 'block' }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${destData.mapLat},${destData.mapLng}&z=13&output=embed`}
              />
            </div>
          )}

          {/* Room types */}
          {selectedHotel.room_types && selectedHotel.room_types.filter(r => r.price_from_usd).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>🛏️ Loại phòng & Giá</h3>
              {selectedHotel.room_types.filter(r => r.price_from_usd).slice(0, 4).map((r, i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', marginBottom: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{r.size_m2 ? `${r.size_m2}m² • ` : ''}{r.capacity} khách</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed' }}>${r.price_from_usd}</div>
                </div>
              ))}
            </div>
          )}

          {/* Experiences */}
          {selectedHotel.experiences && selectedHotel.experiences.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>✨ Trải nghiệm nổi bật</h3>
              {selectedHotel.experiences.slice(0, 3).map((exp, i) => (
                <div key={i} style={{ fontSize: 11, color: '#475569', padding: '6px 0', borderBottom: '1px solid #f1f5f9', lineHeight: 1.5 }}>
                  • {exp.description || exp.name}
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => onSelectDestination(region)}
            style={{ width: '100%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', border: 'none', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            Xem chi tiết & Lên lịch trình <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Hotel list view
  return (
    <div className="tab-view" style={{ overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 8px', background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}>
        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>🏨 Khám phá Resort</h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, margin: 0 }}>Hệ thống {hotels.length} resort & khách sạn Vinpearl</p>

        {/* Search bar */}
        <div style={{ marginTop: 12, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm resort, địa điểm..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10, border: 'none', fontSize: 12, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.95)' }}
          />
        </div>
      </div>

      {/* Region filter chips */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 8, overflowX: 'auto', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
        {[['all', 'Tất cả', '#7c3aed'], ['phu_quoc', 'Phú Quốc', '#7c3aed'], ['nha_trang', 'Nha Trang', '#0ea5e9'], ['hoi_an', 'Hội An', '#d97706'], ['ha_long', 'Hạ Long', '#10b981']].map(([id, label, color]) => (
          <button
            key={id}
            onClick={() => setSelectedRegion(id)}
            style={{
              flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              background: selectedRegion === id ? color : '#f1f5f9',
              color: selectedRegion === id ? '#fff' : '#64748b',
              transition: 'all 0.2s'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hotel cards */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 32 }}>Không tìm thấy resort phù hợp</div>
        ) : filtered.map((hotel, idx) => {
          const region = getRegion(hotel)
          const minPrice = getMinPrice(hotel)
          const color = regionColor[region]
          const imgSrc = getHotelImage(hotel)

          return (
            <div
              key={idx}
              onClick={() => { setSelectedHotel(hotel); setActiveImageIndex(0) }}
              style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            >
              {/* Hotel image */}
              <div style={{ position: 'relative', height: 150 }}>
                <img src={imgSrc} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.src = '/images/phu_quoc.png' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                <span style={{ position: 'absolute', top: 10, left: 10, background: color, color: '#fff', fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                  {regionLabel[region]}
                </span>
                {minPrice && (
                  <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                    từ ${minPrice}/đêm
                  </span>
                )}
              </div>

              {/* Hotel info */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.3, flex: 1 }}>{hotel.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 8 }}>
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>4.7</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <MapPin size={10} color="#94a3b8" />
                  <span style={{ fontSize: 10, color: '#64748b' }}>{hotel.location}</span>
                </div>

                {hotel.tagline && (
                  <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 8px', fontStyle: 'italic', lineHeight: 1.4 }}>"{hotel.tagline}"</p>
                )}

                {/* Room count badge */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {hotel.room_types && hotel.room_types.filter(r => r.price_from_usd).length > 0 && (
                    <span style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                      {hotel.room_types.filter(r => r.price_from_usd).length} loại phòng
                    </span>
                  )}
                  {hotel.spa && (
                    <span style={{ background: '#fdf4ff', color: '#a855f7', fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>🧖 Spa</span>
                  )}
                  {hotel.experiences && hotel.experiences.length > 0 && (
                    <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 9, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>✨ {hotel.experiences.length} trải nghiệm</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: color, fontWeight: 600 }}>Xem chi tiết →</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
