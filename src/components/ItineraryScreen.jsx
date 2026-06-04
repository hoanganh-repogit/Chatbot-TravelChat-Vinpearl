import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Bed,
  Bus,
  Camera,
  Car,
  Check,
  Clock,
  CloudRain,
  CloudSun,
  Edit2,
  Flame,
  Lock,
  Map,
  MapPin,
  MessageSquare,
  Palmtree,
  Plus,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Sun,
  Trash2,
  Utensils,
  Waves,
  X
} from 'lucide-react'
import { getWeatherForecast } from '../utils/rag'
import { getDaySuggestion } from '../utils/itineraryAI'
import LiveScreen from './LiveScreen'

const destinationProfiles = {
  phu_quoc: {
    name: 'Phú Quốc',
    stay: 'Vinpearl Phú Quốc',
    party: 'Gia đình 4 người',
    image: '/images/phu_quoc.png'
  },
  nha_trang: {
    name: 'Nha Trang',
    stay: 'Vinpearl Nha Trang',
    party: 'Gia đình 4 người',
    image: '/images/nha_trang.png'
  },
  hoi_an: {
    name: 'Nam Hội An',
    stay: 'Vinpearl Nam Hội An',
    party: 'Gia đình 4 người',
    image: '/images/hoi_an.png'
  },
  ha_long: {
    name: 'Hạ Long',
    stay: 'Vinpearl Hạ Long',
    party: 'Gia đình 4 người',
    image: '/images/ha_long.png'
  }
}

export default function ItineraryScreen({
  activeItineraryId,
  itinerary,
  confirmedItinerary,
  journeyStatus = 'draft',
  isGenerating = false,
  onUpdateItinerary,
  onConfirmItinerary,
  onStartLive,
  onReopenDraft,
  setActiveTab
}) {
  const [activeDay, setActiveDay] = useState(1)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editForm, setEditForm] = useState({ time: '', title: '', desc: '' })
  const [weatherForecast, setWeatherForecast] = useState([])
  const [showMapModal, setShowMapModal] = useState(false)
  const [aiDaySuggestion, setAiDaySuggestion] = useState('')
  const aiSuggestCacheRef = useRef({})
  const displayItinerary = journeyStatus === 'draft' ? itinerary : confirmedItinerary || itinerary
  const readOnly = journeyStatus !== 'draft'

  // Fetch weather forecast whenever destination changes
  useEffect(() => {
    if (activeItineraryId) {
      getWeatherForecast(activeItineraryId).then(data => {
        if (data) setWeatherForecast(data)
      })
    }
  }, [activeItineraryId])

  // SEAM: gợi ý AI theo ngày cho badge "Gợi ý từ AI" (fallback = text rule thời tiết)
  useEffect(() => {
    const dayWeather = weatherForecast[activeDay - 1]
    if (!dayWeather) {
      setAiDaySuggestion('')
      return undefined
    }

    const fallbackText = dayWeather.rainProb > 50
      ? 'Dự báo có mưa. Nên đổi lịch trình vui chơi ngoài trời sang Akoya Spa hoặc tham quan indoor.'
      : dayWeather.recommendation

    const cacheKey = `${activeItineraryId}-${activeDay}`
    if (aiSuggestCacheRef.current[cacheKey]) {
      setAiDaySuggestion(aiSuggestCacheRef.current[cacheKey])
      return undefined
    }

    setAiDaySuggestion(fallbackText)

    const source = journeyStatus === 'draft' ? itinerary : confirmedItinerary || itinerary
    const dayData = source?.days?.find(d => d.dayNum === activeDay) || source?.days?.[0] || { events: [] }

    let cancelled = false
    getDaySuggestion({
      destinationId: activeItineraryId,
      dayNum: activeDay,
      events: dayData.events,
      dayWeather,
      fallback: fallbackText,
    }).then(text => {
      if (cancelled || !text) return
      aiSuggestCacheRef.current[cacheKey] = text
      setAiDaySuggestion(text)
    })

    return () => {
      cancelled = true
    }
  }, [activeItineraryId, activeDay, weatherForecast, journeyStatus, itinerary, confirmedItinerary])

  // AI đang sinh lịch trình — chặn chỉnh sửa tới khi xong
  if (isGenerating) {
    return (
      <div className="itinerary-empty itinerary-generating">
        <span className="itinerary-ai-spinner"><Sparkles size={30} /></span>
        <h3>Vinpearl AI đang thiết kế lịch trình…</h3>
        <p className="itinerary-empty-text">
          Đang cá nhân hóa hoạt động theo điểm đến, nhóm khách và thời tiết. Chỉ mất vài giây.
        </p>
      </div>
    )
  }

  if (!displayItinerary) {
    return (
      <div className="itinerary-empty">
        <Map size={60} className="itinerary-empty-icon" />
        <h3>Chưa có lịch trình</h3>
        <p className="itinerary-empty-text">
          Bạn chưa tạo lịch trình nào. Hãy bắt đầu nhắn tin với trợ lý Vinpearl AI để được thiết kế lịch trình cá nhân hóa nhé!
        </p>
        <button className="detail-btn primary" onClick={() => setActiveTab('chat')}>
          Trò chuyện ngay <ArrowRight size={14} style={{ marginLeft: 6 }} />
        </button>
      </div>
    )
  }

  // The real-time Live Reflex experience lives in its own screen
  if (journeyStatus === 'live') {
    return (
      <LiveScreen
        confirmedItinerary={displayItinerary}
        destinationId={activeItineraryId}
      />
    )
  }

  // Current day weather + derived display values
  const currentDayWeather = weatherForecast.find((_, index) => index === activeDay - 1)
  const days = displayItinerary.days || []
  const currentDayData = days.find(d => d.dayNum === activeDay) || days[0] || { events: [] }
  const destination = destinationProfiles[activeItineraryId] || destinationProfiles.phu_quoc

  const dayCount = days.length || 1
  const nightCount = Math.max(dayCount - 1, 0)
  const tripLabel = `${dayCount}N${nightCount}Đ`

  const maxTemp = currentDayWeather?.temperatureMaxC ?? 30
  const minTemp = currentDayWeather?.temperatureMinC ?? 26
  const weatherLabel = currentDayWeather ? getWeatherLabel(currentDayWeather.weather) : 'Đang cập nhật'
  const aiSuggestion = currentDayWeather
    ? (currentDayWeather.rainProb > 50
        ? 'Dự báo có mưa. Nên đổi lịch trình vui chơi ngoài trời sang Akoya Spa hoặc tham quan indoor.'
        : currentDayWeather.recommendation)
    : 'Đang phân tích thời tiết để gợi ý hoạt động phù hợp nhất.'

  // Start editing an event
  const startEdit = (idx, event) => {
    if (readOnly) return
    setEditingIndex(idx)
    setEditForm({ time: event.time, title: event.title, desc: event.desc })
  }

  const cancelEdit = () => setEditingIndex(null)

  // Save edit
  const saveEdit = (idx) => {
    if (readOnly) return
    const updatedEvents = [...currentDayData.events]
    updatedEvents[idx] = { ...editForm }
    const updatedDays = days.map(d => (d.dayNum === activeDay ? { ...d, events: updatedEvents } : d))
    onUpdateItinerary(activeItineraryId, { ...displayItinerary, days: updatedDays })
    setEditingIndex(null)
  }

  // Delete an event
  const deleteEvent = (idx) => {
    if (readOnly) return
    if (window.confirm('Bạn có chắc chắn muốn xóa hoạt động này?')) {
      const updatedEvents = currentDayData.events.filter((_, i) => i !== idx)
      const updatedDays = days.map(d => (d.dayNum === activeDay ? { ...d, events: updatedEvents } : d))
      onUpdateItinerary(activeItineraryId, { ...displayItinerary, days: updatedDays })
      if (editingIndex === idx) setEditingIndex(null)
    }
  }

  // Add a new blank event
  const addNewEvent = () => {
    if (readOnly) return
    const newEvent = { time: '12:00', title: 'Hoạt động mới', desc: 'Nhập mô tả chi tiết tại đây.' }
    const updatedEvents = [...currentDayData.events, newEvent]
    const updatedDays = days.map(d => (d.dayNum === activeDay ? { ...d, events: updatedEvents } : d))
    onUpdateItinerary(activeItineraryId, { ...displayItinerary, days: updatedDays })
    startEdit(updatedEvents.length - 1, newEvent)
  }

  // Render weather icon helper
  const renderWeatherIcon = (weatherType, size = 20) => {
    switch (weatherType) {
      case 'sunny':
        return <Sun size={size} style={{ color: '#fbbf24' }} />
      case 'cloudy':
        return <CloudSun size={size} style={{ color: '#ffffff' }} />
      case 'light_rain':
      case 'heavy_rain':
        return <CloudRain size={size} style={{ color: '#ffffff' }} />
      case 'very_hot':
        return <Flame size={size} style={{ color: '#f97316' }} />
      default:
        return <Sun size={size} style={{ color: '#fbbf24' }} />
    }
  }

  return (
    <div className="tab-view itinerary-screen">
      {/* Header */}
      <div className="itinerary-header">
        <div className="chat-avatar-wrapper itinerary-avatar">
          <img src="/images/ai_avatar.png" alt="AI" className="chat-avatar" />
        </div>
        <div className="itinerary-header-info">
          <h2 className="itinerary-title">Lịch trình {tripLabel}</h2>
          <p className="itinerary-subtitle">{destination.name} · {destination.party}</p>
        </div>
        <span className={`journey-status-pill ${journeyStatus}`}>
          {journeyStatus === 'confirmed' ? <Lock size={12} /> : <Sparkles size={12} />}
          {journeyStatus === 'confirmed' ? 'Đã chốt' : 'Đang chỉnh'}
        </span>
      </div>

      {/* Day Tabs */}
      <div className="itinerary-days-row">
        {days.map((d) => (
          <button
            key={d.dayNum}
            className={`itinerary-day-tab ${activeDay === d.dayNum ? 'active' : ''}`}
            onClick={() => {
              setActiveDay(d.dayNum)
              cancelEdit()
            }}
          >
            Ngày {d.dayNum}
          </button>
        ))}
      </div>

      {/* Weather Forecast Hero Card */}
      {currentDayWeather && (
        <div className={`itinerary-weather-card ${currentDayWeather.rainProb > 50 ? 'warning' : ''}`}>
          <img src={destination.image} alt="" className="weather-card-bg" />
          <div className="weather-card-overlay" />
          <div className="weather-card-content">
            <div className="weather-card-top">
              <span className="weather-location"><MapPin size={16} /> {destination.stay}</span>
              <button className="weather-hourly-toggle" type="button">
                <Clock size={14} /> Dự báo giờ
              </button>
            </div>

            <div className="weather-current-temp">{maxTemp}°</div>
            <div className="weather-condition-line">
              {renderWeatherIcon(currentDayWeather.weather, 22)}
              <span>{weatherLabel}</span>
            </div>
            <div className="weather-temp-range">C:{maxTemp}°&nbsp;&nbsp;T:{minTemp}°</div>

            <div className="weather-hourly-row">
              {buildHourlyWeather(currentDayWeather).map((slot) => (
                <div className="weather-hour-slot" key={slot.label}>
                  <span className="weather-hour-label">{slot.label}</span>
                  {renderWeatherIcon(slot.weather, 24)}
                  <strong>{slot.temp}°</strong>
                </div>
              ))}
            </div>

            <button className="weather-ai-suggestion" type="button" onClick={() => setActiveTab('chat')}>
              <span className="weather-ai-icon"><Sparkles size={16} /></span>
              <span className="weather-ai-text"><strong>Gợi ý từ AI:</strong> {aiDaySuggestion || aiSuggestion}</span>
              <ArrowRight size={18} className="weather-ai-arrow" />
            </button>
          </div>
        </div>
      )}

      {/* Chat to edit CTA (draft only) */}
      {!readOnly && (
        <div className="itinerary-chat-edit-panel">
          <button
            className="itinerary-chat-edit-btn"
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={18} /> Chat để thay đổi lịch trình
          </button>
          <p>Yêu cầu trợ lý thêm, đổi giờ hoặc bỏ hoạt động; lịch draft sẽ cập nhật ngay trong màn này.</p>
        </div>
      )}

      {journeyStatus === 'confirmed' && (
        <div className="journey-confirmed-banner">
          <Lock size={15} />
          <span>Lịch trình đã được chốt. Bắt đầu Live để AI theo dõi thời tiết, queue và trạng thái gia đình theo thời gian thực.</span>
        </div>
      )}

      {/* Day section header */}
      <div className="itinerary-day-section">
        <div className="day-section-title">
          <span className="day-section-icon"><Palmtree size={18} /></span>
          Lịch ngày {activeDay}
        </div>
        {!readOnly && (
          <button className="day-section-add-btn" onClick={addNewEvent}>
            <Plus size={15} /> Thêm hoạt động
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="itinerary-list-container">
        <div className="timeline-container draft-timeline">
          <div className="timeline-line"></div>

          {currentDayData.events.map((evt, idx) => {
            const isEditing = editingIndex === idx
            const category = getEventCategory(evt)

            return (
              <div key={idx} className="timeline-event">
                {isEditing ? (
                  <div className="timeline-time">
                    <input
                      type="text"
                      className="edit-time-input"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="timeline-time">{evt.time}</div>
                )}

                <div className="timeline-node-container">
                  <div className="timeline-node"></div>
                </div>

                {isEditing ? (
                  <div className="timeline-card editing-card">
                    <input
                      type="text"
                      className="edit-title-input"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Tên hoạt động"
                    />
                    <textarea
                      className="edit-desc-input"
                      value={editForm.desc}
                      onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                      placeholder="Mô tả chi tiết"
                    />
                    <div className="edit-card-actions">
                      <button className="edit-save-btn" onClick={() => saveEdit(idx)}>
                        <Check size={14} /> Lưu
                      </button>
                      <button className="edit-cancel-btn" onClick={cancelEdit}>
                        <X size={14} /> Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="timeline-card">
                    <div className="timeline-card-media">
                      <img src={destination.image} alt="" />
                    </div>
                    <div className="timeline-card-body">
                      <div className="timeline-card-header">
                        <div className="timeline-card-title-group">
                          <span className="timeline-card-index">{idx + 1}</span>
                          <h4 className="timeline-card-title">{evt.title}</h4>
                        </div>
                        {!readOnly && (
                          <div className="timeline-card-actions">
                            <button className="action-icon-btn edit" onClick={() => startEdit(idx, evt)} title="Sửa hoạt động">
                              <Edit2 size={13} />
                            </button>
                            <button className="action-icon-btn delete" onClick={() => deleteEvent(idx)} title="Xóa hoạt động">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="timeline-card-desc">{evt.desc}</p>
                      <div className="timeline-card-tags">
                        <span className={`timeline-card-tag ${category.kind}`}>
                          {category.icon} {category.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="itinerary-footer">
        <div className="itinerary-footer-actions">
          <button className="itinerary-save-btn secondary" onClick={() => setShowMapModal(true)}>
            <Map size={16} /> Xem Bản Đồ
          </button>
          {journeyStatus === 'draft' ? (
            <button className="itinerary-save-btn" onClick={onConfirmItinerary}>
              <Check size={16} /> Chốt lịch trình
            </button>
          ) : (
            <>
              <button className="itinerary-save-btn secondary" onClick={onReopenDraft}>
                <RotateCcw size={16} /> Mở lại chỉnh sửa
              </button>
              <button className="itinerary-save-btn" onClick={onStartLive}>
                <PlayCircle size={16} /> Bắt đầu Live
              </button>
            </>
          )}
        </div>
      </div>

      {/* Interactive Map Popup Modal */}
      {showMapModal && (
        <div className="detail-overlay active">
          <div className="detail-modal">
            <div className="detail-nav">
              <button className="detail-close-btn" onClick={() => setShowMapModal(false)}>
                ✕
              </button>
              <h3 className="detail-nav-title">Bản đồ điểm đến</h3>
            </div>
            <div className="map-iframe-container" style={{ flex: 1, height: '100%' }}>
              <iframe
                src={`/map.html?destId=${activeItineraryId}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Bản đồ chỉ dẫn"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildHourlyWeather(dayWeather) {
  const min = Number(dayWeather.temperatureMinC || 26)
  const max = Number(dayWeather.temperatureMaxC || min + 5)
  const baseWeather = dayWeather.weather || 'sunny'
  const rainy = Number(dayWeather.rainProb || 0) >= 50

  const temps = [
    Math.max(min, max - 2),
    max,
    max,
    Math.max(min, max - 1),
    Math.max(min, max - 2),
    Math.max(min, max - 3),
  ]

  return ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map((label, index) => ({
    label,
    temp: temps[index],
    weather: rainy && index >= 3 ? 'light_rain' : baseWeather,
  }))
}

function getWeatherLabel(weatherType) {
  const labels = {
    sunny: 'Nhiều nắng',
    cloudy: 'Có mây',
    light_rain: 'Mưa nhẹ',
    heavy_rain: 'Mưa lớn',
    very_hot: 'Nắng nóng',
  }
  return labels[weatherType] || 'Nhiều nắng'
}

// Single category tag shown on each itinerary card
function getEventCategory(event) {
  const text = `${event.title} ${event.desc}`.toLowerCase()

  if (/buffet|ăn|bữa|nhà hàng|ẩm thực|dinner|trưa|tối/.test(text)) {
    return { kind: 'food', icon: <Utensils size={12} />, label: 'Ẩm thực' }
  }
  if (/di chuyển|bus|vinbus|taxi|cáp treo|xuồng|đón|rời|cao tốc/.test(text)) {
    return { kind: 'transport', icon: /bus|vinbus/i.test(text) ? <Bus size={12} /> : <Car size={12} />, label: 'Di chuyển' }
  }
  if (/biển|hồ bơi|water|kayak|tắm/.test(text)) {
    return { kind: 'water', icon: <Waves size={12} />, label: 'Biển & Thư giãn' }
  }
  if (/check-in|checkin|check-out|resort|phòng|nghỉ|spa|yoga/.test(text)) {
    return { kind: 'stay', icon: <Bed size={12} />, label: 'Nghỉ dưỡng' }
  }
  return { kind: 'attraction', icon: <Camera size={12} />, label: 'Tham quan' }
}
