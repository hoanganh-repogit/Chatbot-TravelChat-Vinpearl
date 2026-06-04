import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MoreVertical, Paperclip, Send, Mic, CheckCircle2, Plus } from 'lucide-react'
import { destinationsData } from './ExploreScreen'

export default function ChatScreen({
  messages,
  setMessages,
  onSelectDestination,
  onGenerateItinerary,
  setActiveTab
}) {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return

    // 1. Add User Message
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend }
    setMessages(prev => [...prev, userMsg])
    setInputText('')

    // 2. Start Bot Typing
    setIsTyping(true)

    // 3. Generate Smart Bot Response
    setTimeout(() => {
      setIsTyping(false)
      let botResponse = {}
      const textLower = textToSend.toLowerCase()

      if (textLower.includes('phú quốc') || textLower.includes('20 triệu') || textLower.includes('gia đình 4 người')) {
        // Phu Quoc recommendation matching Screen 2
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Dựa trên nhu cầu của bạn, mình gợi ý điểm đến phù hợp nhất cho gia đình là:',
          recommendation: destinationsData.find(d => d.id === 'phu_quoc')
        }
      } else if (textLower.includes('nha trang') || textLower.includes('hòn tre')) {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Vinpearl Nha Trang là lựa chọn tuyệt vời cho bạn với biển xanh và khu giải trí đỉnh cao:',
          recommendation: destinationsData.find(d => d.id === 'nha_trang')
        }
      } else if (textLower.includes('hội an') || textLower.includes('quảng nam')) {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Vinpearl Nam Hội An sẽ mang đến trải nghiệm giao thoa di sản văn hóa độc đáo:',
          recommendation: destinationsData.find(d => d.id === 'hoi_an')
        }
      } else if (textLower.includes('hạ long') || textLower.includes('đảo rều')) {
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Hãy tận hưởng lâu đài nghỉ dưỡng biệt lập giữa lòng vịnh kỳ quan tại Vinpearl Hạ Long:',
          recommendation: destinationsData.find(d => d.id === 'ha_long')
        }
      } else {
        // Fallback response
        botResponse = {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Chào bạn! Mình là trợ lý AI của Vinpearl. Bạn muốn mình thiết kế lịch trình du lịch cho gia đình đến địa điểm nào (Phú Quốc, Nha Trang, Hội An, Hạ Long)? Hoặc bạn có thể bấm vào các gợi ý có sẵn nhé!'
        }
      }

      setMessages(prev => [...prev, botResponse])
    }, 1200)
  }

  const handleStartSuggestion = () => {
    handleSendMessage('Gia đình 4 người, có 2 bé nhỏ, 3 ngày 2 đêm, ngân sách 20 triệu')
  }

  const handleResetChat = () => {
    setMessages([])
  }

  // --- 1. WELCOME VIEW ---
  if (messages.length === 0) {
    return (
      <div className="welcome-screen">
        <div className="welcome-logo-section">
          <svg className="welcome-logo-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 22h20L12 2zm0 3.99L18.8 19H5.2L12 5.99z" />
          </svg>
          <span className="welcome-logo-title">VINPEARL AI</span>
          <span className="welcome-logo-subtitle">Trợ lý du lịch thông minh</span>
        </div>

        {/* AI Host avatar in center */}
        <div className="welcome-hero-container">
          <div className="welcome-avatar-background"></div>
          <div className="welcome-avatar-image-wrapper">
            <img src="/images/ai_avatar.png" alt="AI Host" className="welcome-avatar-image" />
          </div>
        </div>

        <h1 className="welcome-greeting-title">
          Xin chào Anh,<br />
          Bạn muốn khám phá<br />
          <span className="welcome-greeting-subtitle">Vinpearl hôm nay?</span>
        </h1>

        {/* Large suggestion card */}
        <div className="suggestion-box" onClick={handleStartSuggestion}>
          <div className="suggestion-label">Gợi ý cho bạn</div>
          <div className="suggestion-text">
            Gia đình 4 người, 3 ngày 2 đêm<br />
            ở Phú Quốc, ngân sách 20 triệu
          </div>
          <div className="suggestion-footer">
            <Paperclip size={18} className="suggestion-attachment-icon" />
            <button className="suggestion-start-btn">
              Bắt đầu →
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="quick-dest-row">
          {['Phú Quốc', 'Nha Trang', 'Hội An', 'Hạ Long'].map(name => (
            <button
              key={name}
              className="quick-dest-chip"
              onClick={() => handleSendMessage(`Giới thiệu chi tiết về Vinpearl ${name}`)}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Mic icon */}
        <div className="mic-button-wrapper">
          <button className="mic-button" onClick={() => handleSendMessage('Lên lịch trình du lịch cho gia đình tôi')}>
            <Mic size={28} />
          </button>
        </div>
      </div>
    )
  }

  // --- 2. ACTIVE CONVERSATION VIEW ---
  return (
    <div className="chat-container">
      {/* Header bar */}
      <div className="chat-header">
        <button className="back-button" onClick={handleResetChat}>
          <ArrowLeft size={20} />
        </button>
        <div className="chat-avatar-wrapper">
          <img src="/images/ai_avatar.png" alt="AI Concierge" className="chat-avatar" />
        </div>
        <div className="chat-header-info">
          <h2 className="chat-header-title">VINPEARL AI</h2>
          <p className="chat-header-subtitle">Trợ lý du lịch Vinpearl</p>
        </div>
        <button className="chat-header-more">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Messages scrolling view */}
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            {msg.sender === 'bot' && (
              <div className="chat-avatar-wrapper" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                <img src="/images/ai_avatar.png" alt="AI Avatar" className="chat-avatar" />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="message-bubble">
                {msg.text}
              </div>

              {/* Bot Recommendation Card */}
              {msg.recommendation && (
                <div className="recommend-card">
                  <img src={msg.recommendation.image} alt={msg.recommendation.name} className="recommend-img" />
                  <div className="recommend-content">
                    <h3 className="recommend-title">{msg.recommendation.name}</h3>
                    <ul className="recommend-bullets">
                      {msg.recommendation.highlights.map((h, i) => (
                        <li key={i} className="recommend-bullet">
                          <span className="recommend-bullet-icon">
                            <CheckCircle2 size={12} fill="#7c3aed" color="#ffffff" />
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                    <div className="recommend-actions">
                      <button
                        className="recommend-btn secondary"
                        onClick={() => onSelectDestination(msg.recommendation.id)}
                      >
                        Xem chi tiết
                      </button>
                      <button
                        className="recommend-btn primary"
                        onClick={() => {
                          onGenerateItinerary(msg.recommendation.id)
                          setActiveTab('itinerary')
                        }}
                      >
                        Tạo lịch trình
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="message-row bot">
            <div className="chat-avatar-wrapper" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
              <img src="/images/ai_avatar.png" alt="AI Avatar" className="chat-avatar" />
            </div>
            <div className="typing-indicator message-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="chat-input-bar">
        <button className="chat-input-add">
          <Plus size={20} />
        </button>
        <div className="chat-input-field-wrapper">
          <input
            type="text"
            className="chat-input-field"
            placeholder="Nhắn tin với Vinpearl AI..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
          />
          {inputText ? (
            <button className="chat-input-send" onClick={() => handleSendMessage(inputText)}>
              <Send size={14} />
            </button>
          ) : (
            <button className="chat-input-mic">
              <Mic size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
