import React, { useMemo, useState } from 'react'
import {
  Bell, Building2, ChevronRight, Flame, Gamepad2, Gem, Heart, Leaf,
  Menu, Play, Search, ShipWheel, SlidersHorizontal, Sparkles, Star, Umbrella,
  UserRound, Users
} from 'lucide-react'

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

const aiRecommendations = [
  {
    id: 'phu_quoc',
    shortName: 'Phú Quốc',
    match: '97% phù hợp',
    image: '/images/phu_quoc.png',
    subtitle: 'Nghỉ dưỡng · Vui chơi · Thiên nhiên',
    tags: ['VinWonders', 'Safari', 'Resort gia đình']
  },
  {
    id: 'nha_trang',
    shortName: 'Nha Trang',
    match: '94% phù hợp',
    image: '/images/nha_trang.png',
    subtitle: 'Biển xanh · Spa · Thư giãn',
    tags: []
  },
  {
    id: 'hoi_an',
    shortName: 'Hội An',
    match: '92% phù hợp',
    image: '/images/hoi_an.png',
    subtitle: 'Văn hóa · Ẩm thực',
    tags: []
  }
]

const experienceFilters = [
  { id: 'hot', label: 'Nổi bật', icon: Flame },
  { id: 'stay', label: 'Nghỉ dưỡng', icon: Umbrella },
  { id: 'family', label: 'Gia đình', icon: Users },
  { id: 'couple', label: 'Cặp đôi', icon: Heart },
  { id: 'play', label: 'Vui chơi', icon: Gamepad2 },
  { id: 'nature', label: 'Thiên nhiên', icon: Leaf }
]

const collections = [
  { title: 'Luxury Stay', subtitle: 'Đẳng cấp 5 sao', meta: '16 resort', image: '/images/ha_long.png', icon: Gem },
  { title: 'Beach Escape', subtitle: 'Biển xanh cát trắng', meta: '12 điểm đến', image: '/images/phu_quoc.png', icon: Umbrella },
  { title: 'Family Fun', subtitle: 'Vui chơi thỏa thích', meta: '10 trải nghiệm', image: '/images/nha_trang.png', icon: Users },
  { title: 'VinWonders', subtitle: 'Thế giới giải trí', meta: '4 công viên', image: '/images/hoi_an.png', icon: Gamepad2 }
]

const plannerAudiences = [
  { label: 'Gia đình', icon: Users },
  { label: 'Cặp đôi', icon: Heart },
  { label: 'Bạn bè', icon: Users },
  { label: 'Một mình', icon: UserRound }
]

const searchTargets = {
  phu_quoc: 'phú quốc phu quoc vinwonders safari resort gia đình biển đảo nghỉ dưỡng',
  nha_trang: 'nha trang biển xanh spa cáp treo thư giãn hòn tre',
  hoi_an: 'hội an hoi an nam hội an văn hóa ẩm thực phố cổ cặp đôi',
  ha_long: 'hạ long ha long vịnh đảo thiên nhiên luxury stay'
}

export default function ExploreScreen({ onSelectDestination, sendChatQuery }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('hot')
  const [activeAudience, setActiveAudience] = useState('Gia đình')

  const visibleDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return destinationsData
    return destinationsData.filter(destination => {
      const haystack = [
        destination.name,
        destination.location,
        destination.desc,
        destination.highlights.join(' '),
        searchTargets[destination.id] || ''
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [searchQuery])

  const visibleRecommendations = aiRecommendations.filter(item =>
    visibleDestinations.some(destination => destination.id === item.id)
  )

  const handleOpenDestination = (destinationId) => {
    onSelectDestination(destinationId)
  }

  return (
    <div className="explore-ai-screen">
      <header className="explore-ai-header">
        <div className="explore-ai-topbar">
          <button className="explore-ai-icon-btn" title="Menu">
            <Menu size={22} />
          </button>
          <div className="explore-ai-title-block">
            <h1>Khám phá Vinpearl</h1>
            <p>Cùng AI tìm kiếm điểm đến & trải nghiệm hoàn hảo cho chuyến đi của bạn</p>
          </div>
          <button className="explore-ai-icon-btn notification" title="Thông báo">
            <Bell size={21} />
          </button>
        </div>

        <label className="explore-ai-search">
          <Search size={22} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm điểm đến, resort, hoạt động..."
          />
          <SlidersHorizontal size={22} />
        </label>
      </header>

      <section className="explore-planner-card">
        <div className="explore-planner-copy">
          <span className="explore-pill">
            <Sparkles size={15} />
            AI Planner
          </span>
          <h2>Bạn muốn chuyến đi như thế nào?</h2>
          <p>AI sẽ gợi ý điểm đến, resort và lịch trình phù hợp nhất cho bạn.</p>
        </div>

        <div className="explore-planner-visual" aria-hidden="true">
          <div className="explore-planner-bot">
            <span className="bot-eye left" />
            <span className="bot-eye right" />
            <span className="bot-smile" />
          </div>
          <div className="explore-planner-body">
            <Sparkles size={18} />
          </div>
          <div className="explore-planner-bag" />
          <div className="explore-planner-palm" />
        </div>

        <div className="explore-planner-actions">
          {plannerAudiences.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={activeAudience === label ? 'active' : ''}
              onClick={() => {
                const message = label === 'Một mình' ? 'Tôi muốn đi du lịch một mình' : `Tôi muốn đi du lịch với ${label}`
                if (typeof sendChatQuery === 'function') sendChatQuery(message)
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="explore-section">
        <div className="explore-section-heading">
          <h2>
            <Sparkles size={22} />
            AI gợi ý cho bạn
          </h2>
          <button onClick={() => setSearchQuery('')}>
            Xem tất cả <ChevronRight size={18} />
          </button>
        </div>

        <div className="explore-recommend-row">
          {visibleRecommendations.map((item, index) => (
            <button
              key={item.id}
              className={`explore-recommend-card ${index === 0 ? 'large' : ''}`}
              onClick={() => handleOpenDestination(item.id)}
            >
              <img src={item.image} alt={item.shortName} />
              <div className="explore-card-shade" />
              <span className="explore-match-badge">{item.match}</span>
              <div className="explore-recommend-content">
                <h3>{item.shortName}</h3>
                <p>{item.subtitle}</p>
                {item.tags.length > 0 && (
                  <div className="explore-recommend-tags">
                    {item.tags.map(tag => <span key={tag}>{tag}</span>)}
                  </div>
                )}
                <span className="explore-card-cta">Khám phá <ChevronRight size={16} /></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="explore-section">
        <div className="explore-section-heading compact">
          <h2>Bộ sưu tập trải nghiệm</h2>
        </div>

        <div className="explore-filter-row">
          {experienceFilters.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={activeFilter === id ? 'active' : ''}
              onClick={() => setActiveFilter(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="explore-collection-grid">
          {collections.map(({ title, subtitle, meta, image, icon: Icon }) => (
            <button key={title} className="explore-collection-card" onClick={() => setSearchQuery(title)}>
              <img src={image} alt={title} />
              <div className="explore-card-shade" />
              <div className="explore-collection-content">
                <h3><Icon size={17} /> {title}</h3>
                <p>{subtitle}</p>
                <span><Building2 size={13} /> {meta}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="explore-section">
        <div className="explore-section-heading">
          <h2>Điểm đến nổi bật</h2>
          <button onClick={() => setSearchQuery('')}>
            Xem tất cả <ChevronRight size={18} />
          </button>
        </div>

        <div className="explore-featured-grid">
          {visibleDestinations.map(destination => (
            <button
              key={destination.id}
              className="explore-featured-card"
              onClick={() => handleOpenDestination(destination.id)}
            >
              <div className="explore-featured-image">
                <img src={destination.image} alt={destination.name} />
                <span className="explore-play-btn"><Play size={21} fill="currentColor" /></span>
              </div>
              <h3>{destination.name.replace('Vinpearl ', '').replace('Nam ', 'Nam ')}</h3>
              <p>
                <Star size={14} fill="currentColor" />
                {destination.rating} ({destination.ratingCount})
              </p>
            </button>
          ))}
        </div>

        {visibleDestinations.length === 0 && (
          <div className="explore-empty-state">
            <ShipWheel size={28} />
            <p>Không tìm thấy điểm đến phù hợp.</p>
          </div>
        )}
      </section>
    </div>
  )
}
