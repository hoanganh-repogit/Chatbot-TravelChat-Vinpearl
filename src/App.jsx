import React, { useState } from 'react'
import { Compass, MessageSquare, Calendar, User, Signal, Wifi, Battery } from 'lucide-react'
import ExploreScreen, { destinationsData } from './components/ExploreScreen'
import ChatScreen from './components/ChatScreen'
import DetailScreen from './components/DetailScreen'
import ItineraryScreen from './components/ItineraryScreen'
import AccountScreen from './components/AccountScreen'

export default function App() {
  const [activeTab, setActiveTab] = useState('chat') // Default to chat welcome screen as Screen 1
  const [selectedDestinationId, setSelectedDestinationId] = useState(null)
  const [activeItineraryId, setActiveItineraryId] = useState(null)
  const [messages, setMessages] = useState([])

  // Find currently selected destination details if open
  const selectedDestination = destinationsData.find(d => d.id === selectedDestinationId)

  // Generate itinerary action
  const handleGenerateItinerary = (destinationId) => {
    setActiveItineraryId(destinationId)
  }

  // Count user/bot messages for stats
  const chatMessageCount = messages.length

  return (
    <div className="device-container">
      {/* Device notch / Island */}
      <div className="device-notch"></div>

      <div className="device-screen">
        {/* Device Status Bar */}
        <div className="status-bar">
          <span className="status-time">09:42</span>
          <div className="status-icons">
            <Signal size={14} className="status-icon" strokeWidth={2.5} />
            <Wifi size={14} className="status-icon" strokeWidth={2.5} />
            <Battery size={16} className="status-icon" strokeWidth={2} />
          </div>
        </div>

        {/* Scrollable App Core Area */}
        <div className="app-content">
          {activeTab === 'explore' && (
            <ExploreScreen
              onSelectDestination={setSelectedDestinationId}
            />
          )}

          {activeTab === 'chat' && (
            <ChatScreen
              messages={messages}
              setMessages={setMessages}
              onSelectDestination={setSelectedDestinationId}
              onGenerateItinerary={handleGenerateItinerary}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'itinerary' && (
            <ItineraryScreen
              activeItineraryId={activeItineraryId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'account' && (
            <AccountScreen
              chatMessageCount={chatMessageCount}
              itineraryCount={activeItineraryId ? 1 : 0}
            />
          )}

          {/* Floating Destination Details Overlay (Screen 3) */}
          {selectedDestinationId && (
            <DetailScreen
              destination={selectedDestination}
              onClose={() => setSelectedDestinationId(null)}
              onGenerateItinerary={handleGenerateItinerary}
              setActiveTab={setActiveTab}
            />
          )}
        </div>

        {/* Bottom Tab Navigation Bar */}
        <nav className="nav-bar">
          <button
            className={`nav-item ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('explore')
              setSelectedDestinationId(null)
            }}
          >
            <div className="nav-item-icon-wrapper">
              <Compass size={20} />
            </div>
            <span>Khám phá</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('chat')
              setSelectedDestinationId(null)
            }}
          >
            <div className="nav-item-icon-wrapper">
              <MessageSquare size={20} />
            </div>
            <span>Chat</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'itinerary' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('itinerary')
              setSelectedDestinationId(null)
            }}
          >
            <div className="nav-item-icon-wrapper">
              <Calendar size={20} />
            </div>
            <span>Lịch trình</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('account')
              setSelectedDestinationId(null)
            }}
          >
            <div className="nav-item-icon-wrapper">
              <User size={20} />
            </div>
            <span>Tài khoản</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
