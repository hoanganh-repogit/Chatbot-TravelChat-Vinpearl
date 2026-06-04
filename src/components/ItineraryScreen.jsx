import React, { useState, useEffect } from 'react'
import { Map, ArrowRight, Edit2, Trash2, Plus, Check, X, CloudSun, CloudRain, Sun, Flame, AlertTriangle, Sparkles, Lock, PlayCircle, RotateCcw, MessageSquare } from 'lucide-react'
import { getWeatherForecast } from '../utils/rag'
import LiveScreen from './LiveScreen'

export default function ItineraryScreen({
  activeItineraryId,
  itinerary,
  confirmedItinerary,
  journeyStatus = 'draft',
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
  const displayItinerary = journeyStatus === 'draft' ? itinerary : confirmedItinerary || itinerary
  const readOnly = journeyStatus !== 'draft'

  // Reset suggestions and fetch weather forecast whenever destination changes
  useEffect(() => {
    if (activeItineraryId) {
      getWeatherForecast(activeItineraryId).then(data => {
        if (data) setWeatherForecast(data)
      })
    }
  }, [activeItineraryId])

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

  if (journeyStatus === 'live') {
    return (
      <LiveScreen
        confirmedItinerary={displayItinerary}
        destinationId={activeItineraryId}
      />
    )
  }

  // Get current day weather data
  const currentDayWeather = weatherForecast.find((_, index) => index === activeDay - 1);

  const days = displayItinerary.days || []
  const currentDayData = days.find(d => d.dayNum === activeDay) || days[0] || { events: [] }

  // Start editing an event
  const startEdit = (idx, event) => {
    if (readOnly) return
    setEditingIndex(idx)
    setEditForm({
      time: event.time,
      title: event.title,
      desc: event.desc
    })
  }

  // Cancel edit
  const cancelEdit = () => {
    setEditingIndex(null)
  }

  // Save edit
  const saveEdit = (idx) => {
    if (readOnly) return
    const updatedEvents = [...currentDayData.events]
    updatedEvents[idx] = { ...editForm }
    
    const updatedDays = days.map(d => {
      if (d.dayNum === activeDay) {
        return { ...d, events: updatedEvents }
      }
      return d
    })

    onUpdateItinerary(activeItineraryId, { ...displayItinerary, days: updatedDays })
    setEditingIndex(null)
  }

  // Delete an event
  const deleteEvent = (idx) => {
    if (readOnly) return
    if (window.confirm('Bạn có chắc chắn muốn xóa hoạt động này?')) {
      const updatedEvents = currentDayData.events.filter((_, i) => i !== idx)
      const updatedDays = days.map(d => {
        if (d.dayNum === activeDay) {
          return { ...d, events: updatedEvents }
        }
        return d
      })

      onUpdateItinerary(activeItineraryId, { ...displayItinerary, days: updatedDays })
      if (editingIndex === idx) setEditingIndex(null)
    }
  }

  // Add a new blank event
  const addNewEvent = () => {
    if (readOnly) return
    const newEvent = { time: '12:00', title: 'Hoạt động mới', desc: 'Nhập mô tả chi tiết tại đây.' }
    const updatedEvents = [...currentDayData.events, newEvent]
    
    const updatedDays = days.map(d => {
      if (d.dayNum === activeDay) {
        return { ...d, events: updatedEvents }
      }
      return d
    })

    onUpdateItinerary(activeItineraryId, { ...displayItinerary, days: updatedDays })
    // Set editing on the newly added item
    startEdit(updatedEvents.length - 1, newEvent)
  }

  // Render weather icon helper
  const renderWeatherIcon = (weatherType, size = 20) => {
    switch (weatherType) {
      case 'sunny':
        return <Sun size={size} className="weather-icon-sun" style={{ color: '#fbbf24' }} />
      case 'cloudy':
        return <CloudSun size={size} className="weather-icon-cloud" style={{ color: '#ffffff' }} />
      case 'light_rain':
      case 'heavy_rain':
        return <CloudRain size={size} className="weather-icon-rain" style={{ color: '#ffffff' }} />
      case 'very_hot':
        return <Flame size={size} className="weather-icon-hot" style={{ color: '#f97316' }} />
      default:
        return <Sun size={size} style={{ color: '#fbbf24' }} />
    }
  }

  return (
    <div className="tab-view">
      {/* Header */}
      <div className="itinerary-header">
        <div className="chat-avatar-wrapper" style={{ width: '32px', height: '32px' }}>
          <img src="/images/ai_avatar.png" alt="AI" className="chat-avatar" />
        </div>
        <div className="itinerary-header-info">
          <h2 className="itinerary-title">Lịch trình 3N2Đ</h2>
          <p className="itinerary-subtitle">{displayItinerary.title}</p>
        </div>
        <span className={`journey-status-pill ${journeyStatus}`}>
          {journeyStatus === 'confirmed' ? <Lock size={12} /> : <Sparkles size={12} />}
          {journeyStatus === 'confirmed' ? 'Đã chốt' : 'Đang chỉnh'}
        </span>
      </div>

      {journeyStatus === 'confirmed' && (
        <div className="journey-confirmed-banner">
          <Lock size={15} />
          <span>Lịch trình đã được chốt. Bắt đầu Live để AI theo dõi thời tiết, queue và trạng thái gia đình theo thời gian thực.</span>
        </div>
      )}

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

      {/* Weather Summary */}
      {currentDayWeather && (
        <div className={`itinerary-weather-card ${currentDayWeather.rainProb > 50 ? 'warning' : ''}`}>
          <div className="weather-card-top">
            <div>
              <p className="weather-location">{formatWeatherLocation(currentDayWeather.location)}</p>
              <div className="weather-current-temp">{currentDayWeather.temperatureMaxC}°</div>
            </div>
            <div className="weather-condition-panel">
              {renderWeatherIcon(currentDayWeather.weather, 28)}
              <p>{getWeatherLabel(currentDayWeather.weather)}</p>
              <span>C:{currentDayWeather.temperatureMaxC}° T:{currentDayWeather.temperatureMinC}°</span>
            </div>
          </div>

          <div className="weather-hourly-row">
            {buildHourlyWeather(currentDayWeather).map((slot) => (
              <div className="weather-hour-slot" key={slot.label}>
                <span className="weather-hour-label">{slot.label}</span>
                {renderWeatherIcon(slot.weather, 25)}
                <strong>{slot.temp}°</strong>
              </div>
            ))}
          </div>
          
          <div className="weather-recommendation-text">
            <strong>Gợi ý trong ngày:</strong> {currentDayWeather.recommendation}
          </div>

          {currentDayWeather.rainProb > 50 && (
            <div className="weather-rain-warning">
              <AlertTriangle size={14} className="warning-icon" />
              <span>Dự báo ngày có mưa. Bạn nên đổi lịch trình vui chơi ngoài trời sang Akoya Spa hoặc bảo tàng trong nhà để đảm bảo chuyến đi thuận lợi!</span>
            </div>
          )}
        </div>
      )}

      {!readOnly && (
        <div className="itinerary-chat-edit-panel">
          <button className="itinerary-chat-edit-btn" onClick={() => setActiveTab('chat')}>
            <MessageSquare size={16} /> Chat để thay đổi lịch trình
          </button>
          <p>Yêu cầu trợ lý thêm, đổi giờ hoặc bỏ hoạt động; lịch draft sẽ cập nhật ngay trong màn này.</p>
        </div>
      )}

      {/* Scrollable Timeline */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="itinerary-list-container">
        <div className={`timeline-container ${journeyStatus === 'draft' ? 'draft-timeline' : ''}`}>
          <div className="timeline-line"></div>

          {/* Group Header for Day */}
          <div className="timeline-event section-header">
            <div className="timeline-time"></div>
            <div className="timeline-node-container">
              <div className="timeline-node"></div>
            </div>
            <span className="timeline-section-title">Lịch ngày {activeDay}</span>
          </div>

          {currentDayData.events.map((evt, idx) => {
            const isEditing = editingIndex === idx;

            return (
              <div key={idx} className="timeline-event">
                {isEditing ? (
                  <div className="timeline-time" style={{ paddingRight: 4 }}>
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
                    <div className="timeline-card-header">
                      <div className="timeline-card-title-group">
                        <span className="timeline-card-index">{idx + 1}</span>
                        <h4 className="timeline-card-title">{evt.title}</h4>
                      </div>
                      {!readOnly && (
                        <div className="timeline-card-actions">
                          <button className="action-icon-btn edit" onClick={() => startEdit(idx, evt)} title="Sửa hoạt động">
                            <Edit2 size={12} />
                          </button>
                          <button className="action-icon-btn delete" onClick={() => deleteEvent(idx)} title="Xóa hoạt động">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="timeline-card-desc">{evt.desc}</p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add Event Button at end of day timeline */}
          {!readOnly && (
            <div className="timeline-event add-event-row">
              <div className="timeline-time"></div>
              <div className="timeline-node-container">
                <div className="timeline-node add-node"><Plus size={12} /></div>
              </div>
              <button className="timeline-add-btn" onClick={addNewEvent}>
                <Plus size={14} /> Thêm hoạt động mới
              </button>
            </div>
          )}
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

      {/* Interactive Leaflet Google Maps Popup Modal */}
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

  return ['08 giờ', '10 giờ', '12 giờ', '14 giờ', '16 giờ', '18 giờ'].map((label, index) => ({
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

function formatWeatherLocation(location) {
  if (!location) return 'Vinpearl'
  return location.replace('Phú Quốc', 'P. Quốc')
}
