import React, { useState, useEffect, useRef } from 'react'
import {
  Bell, CalendarDays, CheckCircle2, ChevronDown, Edit3, Gift, Hotel,
  MapPin, Menu, MessageSquarePlus, Mic, PawPrint, Plus, Send, Sparkles, Star
} from 'lucide-react'
import { destinationsData } from './ExploreScreen'
import { runAIAgentResponse } from '../utils/llm'

const welcomeDestinations = [
  { id: 'phu_quoc', name: 'Phú Quốc', image: '/images/phu_quoc.png', desc: 'Thiên đường biển đảo', rating: '4.8', reviews: '1.234 đánh giá' },
  { id: 'nha_trang', name: 'Nha Trang', image: '/images/nha_trang.png', desc: 'Vịnh biển tuyệt đẹp', rating: '4.7', reviews: '982 đánh giá' },
  { id: 'hoi_an', name: 'Hội An', image: '/images/hoi_an.png', desc: 'Phố cổ thơ mộng', rating: '4.6', reviews: '754 đánh giá' },
  { id: 'ha_long', name: 'Hạ Long', image: '/images/ha_long.png', desc: 'Di sản thiên nhiên TG', rating: '4.8', reviews: '1.105 đánh giá' }
]

const quickChips = [
  { icon: Hotel, label: 'Resort cho gia đình', query: 'Resort Vinpearl phù hợp cho gia đình có trẻ em' },
  { icon: Sparkles, label: 'VinWonders', query: 'Thông tin VinWonders vé và hoạt động' },
  { icon: PawPrint, label: 'Safari', query: 'Vinpearl Safari Phú Quốc tham quan như thế nào' },
  { icon: CalendarDays, label: 'Lịch trình 3N2Đ', query: 'Lên lịch trình 3 ngày 2 đêm ở Phú Quốc cho gia đình 4 người' }
]

const detectDestinationId = (text, fallback = 'phu_quoc') => {
  const textLower = text.toLowerCase()
  if (textLower.includes('phú quốc') || textLower.includes('phu quoc')) return 'phu_quoc'
  if (textLower.includes('nha trang')) return 'nha_trang'
  if (textLower.includes('nam hội an') || textLower.includes('hội an') || textLower.includes('nam hoi an') || textLower.includes('hoi an')) return 'hoi_an'
  if (textLower.includes('hạ long') || textLower.includes('ha long')) return 'ha_long'
  return fallback
}

const normalizeImageSrc = (src) => {
  if (!src) return ''
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/')) return src
  return `/${src}`
}

export default function ChatScreen({
  chats, activeChatId, setActiveChatId, onNewChat, onRenameChat, onDeleteChat,
  messages, setMessages, onSelectDestination, onGenerateItinerary, setActiveTab,
  activeItineraryId, setActiveItineraryId, currentItinerary, getItinerary,
  onAddActivity, onEditActivity, onDeleteActivity
}) {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeDestinationId, setActiveDestinationId] = useState(activeItineraryId || 'phu_quoc')
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingText, setEditingText] = useState('')

  const messagesEndRef = useRef(null)
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (activeItineraryId) setActiveDestinationId(activeItineraryId)
  }, [activeItineraryId])

  const triggerAiResponse = async (textToSend, currentMessages) => {
    setIsTyping(true)

    const destId = detectDestinationId(textToSend, activeDestinationId)
    const itineraryForDestination = typeof getItinerary === 'function'
      ? getItinerary(destId)
      : currentItinerary

    setActiveDestinationId(destId)
    if (typeof setActiveItineraryId === 'function') setActiveItineraryId(destId)

    try {
      const result = await runAIAgentResponse(
        textToSend,
        currentMessages,
        destId,
        itineraryForDestination,
        {
          addActivity: (day, time, title, desc) => onAddActivity(destId, day, time, title, desc),
          editActivity: (day, index, time, title, desc) => onEditActivity(destId, day, index, time, title, desc),
          deleteActivity: (day, index) => onDeleteActivity(destId, day, index)
        }
      )

      setMessages(prev => [...currentMessages, {
        id: Date.now() + 1,
        sender: 'bot',
        text: result.text,
        recommendation: result.recommendation || null
      }])
    } catch (e) {
      console.error('AI Agent execution error:', e)
      setMessages(prev => [...currentMessages, {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Hệ thống AI của Vinpearl hiện đang bận hoặc gặp lỗi kết nối.\n\nBạn có thể tiếp tục xem và tùy chỉnh Lịch trình, hoặc khám phá các địa điểm trong dữ liệu Vinpearl.'
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return
    const userMsg = { id: Date.now(), sender: 'user', text: textToSend.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInputText('')
    await triggerAiResponse(textToSend.trim(), updatedMessages)
  }

  const handleEditMessage = async (msgId, newText) => {
    if (!newText.trim()) return
    const msgIndex = messages.findIndex(m => m.id === msgId)
    if (msgIndex === -1) return

    const sliced = messages.slice(0, msgIndex + 1).map((msg, index) =>
      index === msgIndex ? { ...msg, text: newText.trim() } : msg
    )
    setMessages(sliced)
    setEditingMessageId(null)
    await triggerAiResponse(newText.trim(), sliced)
  }

  const handleSaveTitle = () => {
    if (tempTitle.trim()) onRenameChat(activeChatId, tempTitle.trim())
    setIsEditingTitle(false)
  }

  const renderInlineMarkdown = (line, isUser = false) => {
    const parts = line.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (/^\[.*?\]\(.*?\)$/.test(part)) {
        const text = part.match(/\[(.*?)\]/)?.[1] || part
        const url = part.match(/\((.*?)\)/)?.[1] || '#'
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={isUser ? 'chat-link user' : 'chat-link'}>
            {text}
          </a>
        )
      }
      return part
    })
  }

  const renderMessageText = (text, sender) => {
    if (!text) return null
    const isUser = sender === 'user'
    const lines = text.replace(/\r\n/g, '\n').split('\n')

    return lines.map((rawLine, index) => {
      const line = rawLine.trimEnd()
      const trimmed = line.trim()

      if (!trimmed) return <div key={index} className="chat-markdown-spacer" />

      if (/^\*\(Hệ thống:/.test(trimmed)) {
        return <p key={index} className="chat-system-note">{trimmed.replace(/^\*\(|\)\*$/g, '')}</p>
      }

      const imgMatch = /!\[(.*?)\]\((.*?)\)/.exec(trimmed)
      if (imgMatch && !isUser) {
        const src = normalizeImageSrc(imgMatch[2])
        return (
          <figure key={index} className="chat-inline-image-box">
            <img
              src={src}
              alt={imgMatch[1] || 'Vinpearl'}
              onError={(e) => { e.currentTarget.closest('.chat-inline-image-box')?.classList.add('is-hidden') }}
            />
            {imgMatch[1] && <figcaption>{imgMatch[1]}</figcaption>}
          </figure>
        )
      }

      if (!isUser && /^#{1,3}\s/.test(trimmed)) {
        const level = trimmed.match(/^#+/)?.[0].length || 2
        const content = trimmed.replace(/^#{1,3}\s/, '')
        const Tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
        return <Tag key={index} className="chat-markdown-heading">{renderInlineMarkdown(content)}</Tag>
      }

      const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed)
      if (bulletMatch && !isUser) {
        return (
          <div key={index} className="chat-markdown-list-row">
            <span className="chat-markdown-bullet">•</span>
            <span>{renderInlineMarkdown(bulletMatch[1])}</span>
          </div>
        )
      }

      const numberedMatch = /^\d+[.)]\s+(.+)$/.exec(trimmed)
      if (numberedMatch && !isUser) {
        return (
          <div key={index} className="chat-markdown-list-row numbered">
            <span className="chat-markdown-number">{trimmed.match(/^\d+/)?.[0]}.</span>
            <span>{renderInlineMarkdown(numberedMatch[1])}</span>
          </div>
        )
      }

      return (
        <p key={index} className={isUser ? 'chat-message-text user' : 'chat-message-text'}>
          {renderInlineMarkdown(line, isUser)}
        </p>
      )
    })
  }

  return (
    <div className="chat-container-layout">
      {isHistoryOpen && (
        <div className="chat-history-overlay" onClick={() => setIsHistoryOpen(false)}>
          <div className="chat-history-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="history-drawer-header">
              <h3>Lịch sử trò chuyện</h3>
              <button className="close-history-btn" onClick={() => setIsHistoryOpen(false)}>x</button>
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
                      <span className="history-chat-count">{chat.messages ? chat.messages.length : 0} tin nhắn</span>
                    </div>
                    <button
                      className="history-chat-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Xóa cuộc trò chuyện "${chat.title}"?`)) onDeleteChat(chat.id)
                      }}
                      title="Xóa"
                    >
                      x
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="vinai-welcome">
          <div className="vinai-hero">
            <img className="vinai-hero-bg" src="/images/phu_quoc.png" alt="" />
            <div className="vinai-hero-wash" />

            <div className="vinai-topbar">
              <button className="vinai-icon-btn" onClick={() => setIsHistoryOpen(true)} title="Lịch sử chat">
                <Menu size={22} />
              </button>
              <button className="vinai-title-btn" onClick={() => setActiveTab && setActiveTab('itinerary')}>
                Hành trình Vinpearl <ChevronDown size={18} />
              </button>
              <button className="vinai-icon-btn notification" onClick={onNewChat} title="Tạo chat mới">
                <Bell size={21} />
              </button>
            </div>

            <div className="vinai-brand">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 22h20L12 2zm0 3.99L18.8 19H5.2L12 5.99z" />
              </svg>
              <div className="vinai-brand-name">VINPEARL AI</div>
              <div className="vinai-brand-subtitle">Trợ lý du lịch thông minh</div>
            </div>

            <div className="vinai-avatar-shell">
              <img src="/images/ai_avatar.png" alt="Vinpearl AI" />
            </div>

            <div className="vinai-greeting">
              <h1>Xin chào Anh!</h1>
              <p>Vinpearl AI luôn sẵn sàng đồng hành cùng bạn trên mọi hành trình.</p>
            </div>

            <div className="vinai-input-card">
              <h2>Bạn muốn trải nghiệm điều gì?</h2>
              <p>Hỏi về điểm đến, resort, hoạt động, lịch trình...</p>
              <div className="vinai-input-row">
                <Sparkles size={19} />
                <input
                  type="text"
                  className="welcome-input-field"
                  placeholder="Nhập câu hỏi của bạn..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inputText.trim() && handleSendMessage(inputText)}
                />
                <button onClick={() => inputText.trim() && handleSendMessage(inputText)} title={inputText ? 'Gửi' : 'Nhập bằng giọng nói'}>
                  {inputText ? <Send size={17} /> : <Mic size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="vinai-quick-row">
            {quickChips.map(({ icon: Icon, label, query }) => (
              <button key={label} className="vinai-quick-chip" onClick={() => handleSendMessage(query)}>
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <section className="vinai-destinations-section">
            <div className="vinai-section-header">
              <h2>Điểm đến nổi bật</h2>
              <button onClick={() => setActiveTab && setActiveTab('explore')}>Xem tất cả</button>
            </div>

            <div className="vinai-destination-row">
              {welcomeDestinations.map(destination => (
                <button
                  key={destination.id}
                  className="vinai-destination-card"
                  onClick={() => handleSendMessage(`Giới thiệu cho tôi về ${destination.name} Vinpearl, có ảnh và vị trí bản đồ`)}
                >
                  <img src={destination.image} alt={destination.name} />
                  <div className="vinai-destination-overlay" />
                  <div className="vinai-destination-content">
                    <h3><MapPin size={13} /> {destination.name}</h3>
                    <p>{destination.desc}</p>
                    <span><Star size={13} fill="currentColor" /> {destination.rating} ({destination.reviews})</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="vinai-promo">
            <div className="vinai-promo-art">
              <Gift size={38} />
            </div>
            <div>
              <h2>Ưu đãi dành riêng cho bạn</h2>
              <p>Khám phá các chương trình khuyến mãi mới nhất từ Vinpearl.</p>
            </div>
            <button onClick={() => handleSendMessage('Có ưu đãi và khuyến mãi gì hiện tại ở Vinpearl?')}>
              Khám phá ngay
            </button>
          </section>
        </div>
      ) : (
        <div className="chat-container active-chat">
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
                <button className="chat-header-title-container" onClick={() => {
                  setIsEditingTitle(true)
                  setTempTitle(activeChat.title)
                }}>
                  <span className="chat-header-title">{activeChat.title}</span>
                  <Edit3 size={11} className="chat-title-edit-icon" />
                </button>
              )}
              <p className="chat-header-subtitle">
                {journeyStatus === 'draft' ? 'Trợ lý du lịch Vinpearl' : 'Lịch trình đã chốt'}
              </p>
            </div>

            <button className="chat-header-more" onClick={onNewChat} title="Tạo đoạn chat mới">
              <MessageSquarePlus size={20} />
            </button>
          </div>

          <div className="messages-list">
            {messages.map(msg => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                {msg.sender === 'bot' && (
                  <div className="chat-avatar-wrapper">
                    <img src="/images/ai_avatar.png" alt="AI Avatar" className="chat-avatar" />
                  </div>
                )}

                <div className="message-stack">
                  {editingMessageId === msg.id ? (
                    <div className="message-edit-box">
                      <textarea
                        className="message-edit-textarea"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                      />
                      <div className="message-edit-actions">
                        <button className="message-edit-cancel" onClick={() => setEditingMessageId(null)}>Hủy</button>
                        <button className="message-edit-save" onClick={() => handleEditMessage(msg.id, editingText)}>Lưu & gửi lại</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="message-bubble">
                        {renderMessageText(msg.text, msg.sender)}
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
                              <button className="recommend-btn secondary" onClick={() => onSelectDestination(msg.recommendation.id)}>
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

            {isTyping && (
              <div className="message-row bot">
                <div className="chat-avatar-wrapper">
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

          <div className="chat-input-bar">
            <button className="chat-input-add" onClick={onNewChat} title="Tạo chat mới">
              <MessageSquarePlus size={20} />
            </button>
            <div className="chat-input-field-wrapper">
              <input
                type="text"
                className="chat-input-field"
                placeholder={journeyStatus === 'draft' ? 'Hỏi thời tiết, vé bay, khách sạn, vui chơi...' : 'Lịch đã chốt, chat chỉ tư vấn thêm...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
              />
              {inputText ? (
                <button className="chat-input-send" onClick={() => handleSendMessage(inputText)} title="Gửi">
                  <Send size={14} />
                </button>
              ) : (
                <button className="chat-input-mic" onClick={() => handleSendMessage('Thời tiết Phú Quốc hôm nay thế nào?')} title="Gợi ý giọng nói">
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
