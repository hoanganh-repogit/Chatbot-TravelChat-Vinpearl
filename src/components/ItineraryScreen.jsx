import React, { useState, useEffect } from 'react'
import { Calendar, Download, Map, ArrowRight, Edit2, Trash2, Plus, Check, X, CloudSun, CloudRain, Sun, Flame, AlertTriangle, Sparkles } from 'lucide-react'
import { getWeatherForecast } from '../utils/rag'
import { getItineraryOptimizationSuggestions } from '../utils/llm'

export default function ItineraryScreen({ activeItineraryId, itinerary, onUpdateItinerary, setActiveTab }) {
  const [activeDay, setActiveDay] = useState(1)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editForm, setEditForm] = useState({ time: '', title: '', desc: '' })
  const [weatherForecast, setWeatherForecast] = useState([])
  const [showMapModal, setShowMapModal] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)
  const [isOptimizing, setIsOptimizing] = useState(false)

  // Reset suggestions and fetch weather forecast whenever destination changes
  useEffect(() => {
    setAiSuggestions(null)
    if (activeItineraryId) {
      getWeatherForecast(activeItineraryId).then(data => {
        if (data) setWeatherForecast(data)
      })
    }
  }, [activeItineraryId])

  const handleOptimizeItinerary = async () => {
    setIsOptimizing(true)
    setAiSuggestions(null)
    try {
      const suggestions = await getItineraryOptimizationSuggestions(activeItineraryId, itinerary, weatherForecast)
      setAiSuggestions(suggestions)
    } catch (e) {
      console.error('Failed to optimize itinerary:', e)
      setAiSuggestions('Hiện tại không thể kết nối đến Trợ lý AI để tối ưu hóa. Vui lòng kiểm tra lại sau!')
    } finally {
      setIsOptimizing(false)
    }
  }

  const renderSuggestionsText = (text) => {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, index) => {
      let processedContent = []
      const parts = line.split(/(\*\*.*?\*\*)/g)
      parts.forEach((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          processedContent.push(<strong key={partIdx}>{part.slice(2, -2)}</strong>)
        } else {
          processedContent.push(part)
        }
      })
      return (
        <p key={index} style={{ margin: '4px 0', lineHeight: '1.4', fontSize: '13px' }}>
          {processedContent}
        </p>
      )
    })
  }

  if (!itinerary) {
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

  // Get current day weather data
  const currentDayWeather = weatherForecast.find((_, index) => index === activeDay - 1);

  const days = itinerary.days || []
  const currentDayData = days.find(d => d.dayNum === activeDay) || days[0] || { events: [] }

  // Start editing an event
  const startEdit = (idx, event) => {
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
    const updatedEvents = [...currentDayData.events]
    updatedEvents[idx] = { ...editForm }
    
    const updatedDays = days.map(d => {
      if (d.dayNum === activeDay) {
        return { ...d, events: updatedEvents }
      }
      return d
    })

    onUpdateItinerary(activeItineraryId, { ...itinerary, days: updatedDays })
    setEditingIndex(null)
  }

  // Delete an event
  const deleteEvent = (idx) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hoạt động này?')) {
      const updatedEvents = currentDayData.events.filter((_, i) => i !== idx)
      const updatedDays = days.map(d => {
        if (d.dayNum === activeDay) {
          return { ...d, events: updatedEvents }
        }
        return d
      })

      onUpdateItinerary(activeItineraryId, { ...itinerary, days: updatedDays })
      if (editingIndex === idx) setEditingIndex(null)
    }
  }

  // Add a new blank event
  const addNewEvent = () => {
    const newEvent = { time: '12:00', title: 'Hoạt động mới', desc: 'Nhập mô tả chi tiết tại đây.' }
    const updatedEvents = [...currentDayData.events, newEvent]
    
    const updatedDays = days.map(d => {
      if (d.dayNum === activeDay) {
        return { ...d, events: updatedEvents }
      }
      return d
    })

    onUpdateItinerary(activeItineraryId, { ...itinerary, days: updatedDays })
    // Set editing on the newly added item
    startEdit(updatedEvents.length - 1, newEvent)
  }

  // Render weather icon helper
  const renderWeatherIcon = (weatherType) => {
    switch (weatherType) {
      case 'sunny':
        return <Sun size={20} className="weather-icon-sun" style={{ color: '#fbbf24' }} />
      case 'cloudy':
        return <CloudSun size={20} className="weather-icon-cloud" style={{ color: '#94a3b8' }} />
      case 'light_rain':
      case 'heavy_rain':
        return <CloudRain size={20} className="weather-icon-rain" style={{ color: '#38bdf8' }} />
      case 'very_hot':
        return <Flame size={20} className="weather-icon-hot" style={{ color: '#ef4444' }} />
      default:
        return <Sun size={20} style={{ color: '#fbbf24' }} />
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
          <p className="itinerary-subtitle">{itinerary.title}</p>
        </div>
      </div>

      {/* Day Tabs with Weather quick glance */}
      <div className="itinerary-days-row">
        {days.map((d, index) => {
          const dayWeather = weatherForecast[index];
          return (
            <button
              key={d.dayNum}
              className={`itinerary-day-tab ${activeDay === d.dayNum ? 'active' : ''}`}
              onClick={() => {
                setActiveDay(d.dayNum)
                cancelEdit()
              }}
            >
              <div className="day-tab-content">
                <span>Ngày {d.dayNum}</span>
                {dayWeather && (
                  <span className="day-tab-weather-temp">{dayWeather.temperatureMaxC}°C</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Weather Recommendation Banner */}
      {currentDayWeather && (
        <div className={`itinerary-weather-box ${currentDayWeather.rainProb > 50 ? 'warning' : ''}`}>
          <div className="weather-box-top">
            <div className="weather-info-pill">
              {renderWeatherIcon(currentDayWeather.weather)}
              <span className="weather-temp-range">
                {currentDayWeather.temperatureMinC}°C - {currentDayWeather.temperatureMaxC}°C
              </span>
            </div>
            <span className="weather-rain-prob">Mưa: {currentDayWeather.rainProb}%</span>
          </div>
          
          <div className="weather-recommendation-text">
            <strong>Gợi ý hoạt động:</strong> {currentDayWeather.recommendation}
          </div>

          {currentDayWeather.rainProb > 50 && (
            <div className="weather-rain-warning">
              <AlertTriangle size={14} className="warning-icon" />
              <span>Dự báo ngày có mưa. Bạn nên đổi lịch trình vui chơi ngoài trời sang Akoya Spa hoặc bảo tàng trong nhà để đảm bảo chuyến đi thuận lợi!</span>
            </div>
          )}
        </div>
      )}

      {/* AI Itinerary Copilot Controller */}
      <div className="itinerary-ai-copilot-panel" style={{ margin: '0 16px 12px 16px' }}>
        {!aiSuggestions && !isOptimizing && (
          <button 
            className="itinerary-optimize-btn" 
            onClick={handleOptimizeItinerary}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
          >
            <Sparkles size={16} /> Tối ưu hóa lịch trình bằng AI
          </button>
        )}

        {isOptimizing && (
          <div 
            className="itinerary-ai-loading"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(124, 58, 237, 0.05)',
              borderRadius: '12px',
              border: '1px dashed rgba(124, 58, 237, 0.3)',
              fontSize: '13px',
              color: '#7c3aed'
            }}
          >
            <div className="typing-dot" style={{ background: '#7c3aed', width: '6px', height: '6px', display: 'inline-block', borderRadius: '50%', margin: '0 2px' }}></div>
            <div className="typing-dot" style={{ background: '#7c3aed', width: '6px', height: '6px', display: 'inline-block', borderRadius: '50%', margin: '0 2px' }}></div>
            <span>Trợ lý AI đang phân tích lịch trình & thời tiết...</span>
          </div>
        )}

        {aiSuggestions && (
          <div 
            className="itinerary-ai-suggestions-card"
            style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)',
              border: '1px solid #ddd6fe',
              borderRadius: '16px',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.08)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setAiSuggestions(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#7c3aed' }}>
              <Sparkles size={16} fill="#7c3aed" />
              <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trợ lý AI Gợi ý Tối ưu</strong>
            </div>
            <div style={{ color: '#4c1d95', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
              {renderSuggestionsText(aiSuggestions)}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#6d28d9', fontStyle: 'italic' }}>
              * Bạn có thể nhắn tin trực tiếp với AI trợ lý để yêu cầu áp dụng điều chỉnh này.
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Timeline */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="itinerary-list-container">
        <div className="timeline-container">
          <div className="timeline-line"></div>

          {/* Group Header for Day */}
          <div className="timeline-event section-header">
            <div className="timeline-time"></div>
            <div className="timeline-node-container">
              <div className="timeline-node"></div>
            </div>
            <span className="timeline-section-title">Timeline ngày {activeDay}</span>
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
                      <h4 className="timeline-card-title">{evt.title}</h4>
                      <div className="timeline-card-actions">
                        <button className="action-icon-btn edit" onClick={() => startEdit(idx, evt)} title="Sửa hoạt động">
                          <Edit2 size={12} />
                        </button>
                        <button className="action-icon-btn delete" onClick={() => deleteEvent(idx)} title="Xóa hoạt động">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="timeline-card-desc">{evt.desc}</p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add Event Button at end of day timeline */}
          <div className="timeline-event add-event-row">
            <div className="timeline-time"></div>
            <div className="timeline-node-container">
              <div className="timeline-node add-node"><Plus size={12} /></div>
            </div>
            <button className="timeline-add-btn" onClick={addNewEvent}>
              <Plus size={14} /> Thêm hoạt động mới
            </button>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="itinerary-footer">
        <button className="itinerary-save-btn secondary" onClick={() => setShowMapModal(true)}>
          <Map size={16} /> Xem Bản Đồ
        </button>
        <button className="itinerary-save-btn" onClick={() => alert('Đã lưu lịch trình thành công vào máy của bạn!')}>
          <Download size={16} /> Lưu Lịch Trình
        </button>
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
