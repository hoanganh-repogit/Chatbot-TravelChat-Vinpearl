import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MessageSquarePlus, Paperclip, Send, Mic, CheckCircle2, Plus, Menu, Edit3, Trash2 } from 'lucide-react'
import { destinationsData } from './ExploreScreen'
import { searchMockDatabase } from '../utils/rag'
import { runAIAgentResponse } from '../utils/llm'

export default function ChatScreen({
  chats,
  activeChatId,
  setActiveChatId,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  messages,
  setMessages,
  onSelectDestination,
  onGenerateItinerary,
  setActiveTab,
  activeItineraryId,
  currentItinerary,
  onAddActivity,
  onEditActivity,
  onDeleteActivity
}) {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeDestinationId, setActiveDestinationId] = useState('phu_quoc')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingText, setEditingText] = useState('')

  const messagesEndRef = useRef(null)
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0]

  // Scroll to bottom when messages or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const triggerAiResponse = async (textToSend, currentMessages) => {
    setIsTyping(true)

    const textLower = textToSend.toLowerCase()
    let destId = activeDestinationId
    if (textLower.includes('phú quốc') || textLower.includes('phu quoc')) destId = 'phu_quoc'
    else if (textLower.includes('nha trang')) destId = 'nha_trang'
    else if (textLower.includes('hội an') || textLower.includes('hoi an')) destId = 'hoi_an'
    else if (textLower.includes('hạ long') || textLower.includes('ha long')) destId = 'ha_long'

    setActiveDestinationId(destId)

    try {
      const result = await runAIAgentResponse(
        textToSend,
        currentMessages,
        destId,
        currentItinerary,
        {
          addActivity: (day, time, title, desc) => onAddActivity(day, time, title, desc),
          editActivity: (day, index, time, title, desc) => onEditActivity(day, index, time, title, desc),
          deleteActivity: (day, index) => onDeleteActivity(day, index)
        }
      )

      setIsTyping(false)
      const botResponse = {
        id: Date.now() + 1,
        sender: 'bot',
        text: result.text,
        recommendation: result.recommendation || destinationsData.find(d => d.id === destId)
      }
      setMessages(prev => [...currentMessages, botResponse])
    } catch (e) {
      console.error('AI Agent execution error:', e)
      setIsTyping(false)
      setMessages(prev => [...currentMessages, {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Hệ thống AI của Vinpearl hiện đang bận hoặc gặp lỗi kết nối. Dưới đây là thông tin dự phòng:\n\n* Bạn có thể tiếp tục xem và tùy chỉnh Lịch Trình hoặc khám phá các địa điểm trên trang chủ Vinpearl.'
      }])
    }
  }

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInputText('')

    await triggerAiResponse(textToSend, updatedMessages)
  }

  const handleEditMessage = async (msgId, newText) => {
    if (!newText.trim()) return
    const msgIndex = messages.findIndex(m => m.id === msgId)
    if (msgIndex === -1) return

    // Slice history up to edited message and update it
    const sliced = messages.slice(0, msgIndex + 1)
    sliced[msgIndex].text = newText
    setMessages(sliced)
    setEditingMessageId(null)

    await triggerAiResponse(newText, sliced)
  }

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onRenameChat(activeChatId, tempTitle)
    }
    setIsEditingTitle(false)
  }

  const handleStartSuggestion = () => {
    handleSendMessage('Gia đình 4 người, có 2 bé nhỏ, 3 ngày 2 đêm, ngân sách 20 triệu ở Phú Quốc')
  }

  // Text formatter with bold markdown and images parsing
  const renderMessageText = (text) => {
    if (!text) return null
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // 1. Image Markdown Detection: ![alt](url)
      const imgRegex = /!\[(.*?)\]\((.*?)\)/g
      const imgMatch = imgRegex.exec(line)
      if (imgMatch) {
        const alt = imgMatch[1]
        const src = imgMatch[2]
        return (
          <div key={index} className="chat-inline-image-box" style={{ margin: '8px 0', borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src={src}
              alt={alt}
              style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
              onError={(e) => {
                // If local image fails due to path name formatting, try stripping leading slash
                if (src.startsWith('/')) {
                  e.target.src = src.substring(1)
                } else {
                  e.target.style.display = 'none'
                }
              }}
            />
            {alt && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', textAlign: 'center', fontStyle: 'italic' }}>{alt}</div>}
          </div>
        )
      }

      // 2. Bold tags parsing (**text**)
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
        <p key={index} style={{ margin: '4px 0', minHeight: '1.2em', lineHeight: '1.5' }}>
          {processedContent}
        </p>
      )
    })
  }

  return (
    <div className="chat-container-layout" style={{ height: '100%', position: 'relative' }}>
      
      {/* 1. SIDEBAR HISTORY DRAWER */}
      {isHistoryOpen && (
        <div className="chat-history-overlay" onClick={() => setIsHistoryOpen(false)}>
          <div className="chat-history-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="history-drawer-header">
              <h3>Lịch sử trò chuyện</h3>
              <button className="close-history-btn" onClick={() => setIsHistoryOpen(false)}>
                ✕
              </button>
            </div>
            
            <button className="new-chat-drawer-btn" onClick={() => {
              onNewChat()
              setIsHistoryOpen(false)
            }}>
              <Plus size={16} /> Tạo đoạn chat mới
            </button>

            <div className="history-chats-list">
              {chats.map(chat => {
                const isActive = chat.id === activeChatId
                return (
                  <div 
                    key={chat.id} 
                    className={`history-chat-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveChatId(chat.id)
                      setIsHistoryOpen(false)
                    }}
                  >
                    <div className="history-chat-item-info">
                      <span className="history-chat-title">{chat.title}</span>
                      <span className="history-chat-count">
                        {chat.messages ? chat.messages.length : 0} tin nhắn
                      </span>
                    </div>
                    <button 
                      className="history-chat-delete-btn" 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Xóa cuộc trò chuyện "${chat.title}"?`)) {
                          onDeleteChat(chat.id)
                        }
                      }}
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        /* --- WELCOME VIEW --- */
        <div className="welcome-screen">
          <div className="welcome-header-bar">
            <button className="welcome-history-btn" onClick={() => setIsHistoryOpen(true)}>
              <Menu size={20} />
            </button>
            {isEditingTitle ? (
              <input
                type="text"
                className="welcome-title-input"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
              />
            ) : (
              <span className="welcome-header-title-active" onClick={() => {
                setIsEditingTitle(true)
                setTempTitle(activeChat.title)
              }}>
                {activeChat.title} <Edit3 size={10} style={{ marginLeft: 4, display: 'inline-block' }} />
              </span>
            )}
            <button className="welcome-newchat-btn" onClick={onNewChat} title="Tạo chat mới">
              <Plus size={20} />
            </button>
          </div>

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
                onClick={() => handleSendMessage(`Thời tiết ở ${name} tuần này và gợi ý phòng khách sạn`)}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Mic icon */}
          <div className="mic-button-wrapper">
            <button className="mic-button" onClick={() => handleSendMessage('Tìm cho tôi chuyến bay từ Hà Nội đi Phú Quốc ngày 12/06')}>
              <Mic size={28} />
            </button>
          </div>
        </div>
      ) : (
        /* --- ACTIVE CONVERSATION VIEW --- */
        <div className="chat-container">
          {/* Header bar */}
          <div className="chat-header">
            <button className="back-button" onClick={() => setIsHistoryOpen(true)} title="Lịch sử chat">
              <Menu size={20} />
            </button>
            
            <div className="chat-header-info">
              {isEditingTitle ? (
                <input
                  type="text"
                  className="chat-header-title-input"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                />
              ) : (
                <div className="chat-header-title-container" onClick={() => {
                  setIsEditingTitle(true)
                  setTempTitle(activeChat.title)
                }}>
                  <h2 className="chat-header-title">{activeChat.title}</h2>
                  <Edit3 size={11} className="chat-title-edit-icon" />
                </div>
              )}
              <p className="chat-header-subtitle">Trợ lý du lịch Vinpearl</p>
            </div>

            <button className="chat-header-more" onClick={onNewChat} title="Tạo đoạn chat mới">
              <MessageSquarePlus size={20} style={{ color: '#7c3aed' }} />
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
                
                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '82%', position: 'relative' }}>
                  {editingMessageId === msg.id ? (
                    <div className="message-edit-box">
                      <textarea
                        className="message-edit-textarea"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="message-edit-actions">
                        <button className="message-edit-cancel" onClick={() => setEditingMessageId(null)}>Hủy</button>
                        <button className="message-edit-save" onClick={() => handleEditMessage(msg.id, editingText)}>Lưu & Gửi lại</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="message-bubble">
                        {renderMessageText(msg.text)}
                        {msg.sender === 'user' && (
                          <button 
                            className="message-edit-trigger-btn"
                            onClick={() => {
                              setEditingMessageId(msg.id)
                              setEditingText(msg.text)
                            }}
                            title="Sửa tin nhắn"
                          >
                            <Edit3 size={11} />
                          </button>
                        )}
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
                    </>
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
            <button className="chat-input-add" onClick={onNewChat} title="Tạo chat mới">
              <MessageSquarePlus size={20} />
            </button>
            <div className="chat-input-field-wrapper">
              <input
                type="text"
                className="chat-input-field"
                placeholder="Hỏi thời tiết, vé bay, khách sạn, vui chơi..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              />
              {inputText ? (
                <button className="chat-input-send" onClick={() => handleSendMessage(inputText)}>
                  <Send size={14} />
                </button>
              ) : (
                <button className="chat-input-mic" onClick={() => handleSendMessage('Thời tiết Phú Quốc hôm nay thế nào?')}>
                  <Mic size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
