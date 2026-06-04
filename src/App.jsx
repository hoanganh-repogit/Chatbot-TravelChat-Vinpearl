import React, { useState, useEffect } from 'react'
import { Compass, Sparkles, Calendar, User, Signal, Wifi, Battery } from 'lucide-react'
import ExploreScreen, { destinationsData } from './components/ExploreScreen'
import ChatScreen from './components/ChatScreen'
import DetailScreen from './components/DetailScreen'
import ItineraryScreen from './components/ItineraryScreen'
import AccountScreen from './components/AccountScreen'

// Initial database templates for the 4 destinations
const initialItineraries = {
  phu_quoc: {
    title: 'Phú Quốc - Gia đình 4 người',
    days: [
      {
        dayNum: 1,
        events: [
          { time: '14:00', title: 'Check-in Vinpearl Resort', desc: 'Nhận phòng và nghỉ ngơi tại resort đẳng cấp.' },
          { time: '16:00', title: 'Tắm biển & Hồ bơi', desc: 'Thư giãn tại bãi biển riêng Bãi Dài cát trắng mịn.' },
          { time: '19:00', title: 'Buffet tối tại nhà hàng', desc: 'Thưởng thức ẩm thực buffet hải sản Phú Quốc phong phú.' }
        ]
      },
      {
        dayNum: 2,
        events: [
          { time: '08:30', title: 'VinWonders Phú Quốc', desc: 'Vui chơi thỏa thích tại công viên chủ đề lớn nhất Việt Nam.' },
          { time: '13:00', title: 'Ăn trưa tại VinWonders', desc: 'Thưởng thức cơm trưa tại khu ẩm thực Disney.' },
          { time: '15:00', title: 'Vinpearl Safari', desc: 'Khám phá công viên bảo tồn động vật hoang dã độc đáo.' },
          { time: '19:00', title: 'Grand World Phú Quốc', desc: 'Check-in thành phố không ngủ và thưởng thức show diễn.' }
        ]
      },
      {
        dayNum: 3,
        events: [
          { time: '09:00', title: 'Thư giãn tại Spa', desc: 'Trải nghiệm liệu trình mát-xa đá nóng Akoya Spa.' },
          { time: '11:00', title: 'Check-out', desc: 'Trả phòng và làm thủ tục kết thúc kỳ nghỉ đáng nhớ.' }
        ]
      }
    ]
  },
  nha_trang: {
    title: 'Nha Trang - Gia đình 4 người',
    days: [
      {
        dayNum: 1,
        events: [
          { time: '14:00', title: 'Di chuyển cáp treo', desc: 'Check-in Vinpearl Resort Nha Trang trên đảo Hòn Tre.' },
          { time: '16:00', title: 'Vui chơi bãi biển', desc: 'Thư giãn tắm biển và chèo thuyền Kayak.' },
          { time: '19:00', title: 'Buffet tối hải sản', desc: 'Dùng bữa tại nhà hàng Indigo lộng gió.' }
        ]
      },
      {
        dayNum: 2,
        events: [
          { time: '08:30', title: 'VinWonders Nha Trang', desc: 'Khám phá Đồi Vạn Hoa và Công viên nước khổng lồ.' },
          { time: '13:00', title: 'Ăn trưa ẩm thực Nha Trang', desc: 'Thưởng thức đặc sản bún chả cá, nem nướng.' },
          { time: '15:00', title: 'Bánh xe bầu trời (Sky Wheel)', desc: 'Ngắm trọn vịnh Nha Trang từ cabin đu quay khổng lồ.' },
          { time: '19:30', title: 'Tata Show', desc: 'Thưởng thức show diễn thực cảnh đa phương tiện đẳng cấp thế giới.' }
        ]
      },
      {
        dayNum: 3,
        events: [
          { time: '08:30', title: 'Tắm bùn khoáng nóng', desc: 'Thư giãn phục hồi sức khỏe tại khu Akoya Spa.' },
          { time: '11:00', title: 'Check-out & Cáp treo', desc: 'Trả phòng và lên cáp treo quay về đất liền.' }
        ]
      }
    ]
  },
  hoi_an: {
    title: 'Hội An - Gia đình 4 người',
    days: [
      {
        dayNum: 1,
        events: [
          { time: '14:00', title: 'Check-in Nam Hội An Resort', desc: 'Nhận phòng biệt thự sang trọng.' },
          { time: '15:30', title: 'Tham quan trang trại VinEco', desc: 'Trải nghiệm nông nghiệp công nghệ cao và hái quả.' },
          { time: '19:00', title: 'Buffet tối xứ Quảng', desc: 'Thưởng thức mì Quảng và ẩm thực miền Trung.' }
        ]
      },
      {
        dayNum: 2,
        events: [
          { time: '08:30', title: 'VinWonders Nam Hội An', desc: 'Khám phá đảo Văn Hóa Dân Gian, khu trò chơi dân gian.' },
          { time: '11:30', title: 'River Safari', desc: 'Khám phá vườn thú hoang dã độc đáo bằng thuyền.' },
          { time: '13:00', title: 'Ăn trưa tại khu ẩm thực', desc: 'Thưởng thức các món đặc sản phố cổ.' },
          { time: '16:00', title: 'Vui chơi Công viên nước', desc: 'Thử thách với dòng sông lười và máng trượt.' }
        ]
      },
      {
        dayNum: 3,
        events: [
          { time: '09:00', title: 'Trị liệu truyền thống Spa', desc: 'Massage body thảo dược phục hồi sức khỏe.' },
          { time: '11:00', title: 'Check-out', desc: 'Trả phòng và mua sắm quà lưu niệm.' }
        ]
      }
    ]
  },
  ha_long: {
    title: 'Hạ Long - Gia đình 4 người',
    days: [
      {
        dayNum: 1,
        events: [
          { time: '14:00', title: 'Đón xuồng cao tốc ra đảo', desc: 'Check-in Vinpearl Resort & Spa Hạ Long trên đảo Rều.' },
          { time: '16:00', title: 'Hồ bơi vô cực ngắm vịnh', desc: 'Thư giãn tắm nắng ngắm cảnh hoàng hôn huyền ảo.' },
          { time: '19:00', title: 'Buffet tối ẩm thực Pháp-Việt', desc: 'Dùng tiệc buffet cao cấp tại nhà hàng Akoya.' }
        ]
      },
      {
        dayNum: 2,
        events: [
          { time: '08:30', title: 'Tham quan vịnh Hạ Long', desc: 'Đi tàu tham quan Động Thiên Cung và Hang Đầu Gỗ.' },
          { time: '13:00', title: 'Ăn trưa hải sản trên tàu', desc: 'Thưởng thức hải sản Hạ Long tươi sống được chế biến tại chỗ.' },
          { time: '15:30', title: 'Chèo thuyền Kayak', desc: 'Tự do chèo thuyền ngắm vách đá vôi kỳ vĩ.' },
          { time: '19:00', title: 'Tiệc nướng BBQ bãi biển', desc: 'Ăn tối tiệc nướng BBQ lãng mạn ngoài bãi biển.' }
        ]
      },
      {
        dayNum: 3,
        events: [
          { time: '08:30', title: 'Tập Yoga đón bình minh', desc: 'Trải nghiệm buổi sáng trong lành tại bãi cỏ hướng vịnh.' },
          { time: '11:00', title: 'Check-out & Rời đảo', desc: 'Trả phòng và đi xuồng cao tốc về lại bến tàu.' }
        ]
      }
    ]
  }
};

const welcomeChat = {
  id: 'welcome_chat',
  title: 'Hành trình Vinpearl 1',
  messages: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [selectedDestinationId, setSelectedDestinationId] = useState(null)
  const [activeItineraryId, setActiveItineraryId] = useState('phu_quoc')
  
  // Custom itineraries state holding user modifications
  const [customItineraries, setCustomItineraries] = useState(initialItineraries)

  // Multi-session chat history states
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('vinpearl_chats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing localStorage chats:', e);
      }
    }
    return [welcomeChat];
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = localStorage.getItem('vinpearl_active_chat_id');
    if (saved) return saved;
    return 'welcome_chat';
  });

  // Save chats changes to localStorage
  useEffect(() => {
    localStorage.setItem('vinpearl_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('vinpearl_active_chat_id', activeChatId);
  }, [activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  // Find currently selected destination details if open
  const selectedDestination = destinationsData.find(d => d.id === selectedDestinationId)

  // Update itinerary callback
  const handleUpdateItinerary = (destinationId, newItinerary) => {
    setCustomItineraries(prev => ({
      ...prev,
      [destinationId]: newItinerary
    }))
  }

  // AI Agent tools itinerary event manipulators
  const handleAddItineraryActivity = (destinationId, dayNum, time, title, desc) => {
    setCustomItineraries(prev => {
      const itin = prev[destinationId] || { title: `${destinationId} - Lịch trình`, days: [] };
      const days = [...itin.days];
      let day = days.find(d => d.dayNum === dayNum);
      if (!day) {
        day = { dayNum, events: [] };
        days.push(day);
      }
      day.events = [...day.events, { time, title, desc }];
      return {
        ...prev,
        [destinationId]: { ...itin, days }
      };
    });
  };

  const handleEditItineraryActivity = (destinationId, dayNum, eventIndex, time, title, desc) => {
    setCustomItineraries(prev => {
      const itin = prev[destinationId];
      if (!itin) return prev;
      const days = itin.days.map(d => {
        if (d.dayNum === dayNum) {
          const events = [...d.events];
          if (events[eventIndex]) {
            events[eventIndex] = { time, title, desc };
          }
          return { ...d, events };
        }
        return d;
      });
      return {
        ...prev,
        [destinationId]: { ...itin, days }
      };
    });
  };

  const handleDeleteItineraryActivity = (destinationId, dayNum, eventIndex) => {
    setCustomItineraries(prev => {
      const itin = prev[destinationId];
      if (!itin) return prev;
      const days = itin.days.map(d => {
        if (d.dayNum === dayNum) {
          const events = d.events.filter((_, idx) => idx !== eventIndex);
          return { ...d, events };
        }
        return d;
      });
      return {
        ...prev,
        [destinationId]: { ...itin, days }
      };
    });
  };

  // Generate itinerary action
  const handleGenerateItinerary = (destinationId) => {
    setActiveItineraryId(destinationId)
  }

  // Chats Handlers
  const handleNewChat = () => {
    const newId = 'chat_' + Date.now();
    const newChat = {
      id: newId,
      title: `Hành trình Vinpearl ${chats.length + 1}`,
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  const handleRenameChat = (chatId, newTitle) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
  };

  const handleDeleteChat = (chatId) => {
    const remaining = chats.filter(c => c.id !== chatId);
    if (remaining.length === 0) {
      const welcome = {
        id: 'welcome_chat',
        title: 'Hành trình Vinpearl 1',
        messages: []
      };
      setChats([welcome]);
      setActiveChatId('welcome_chat');
    } else {
      setChats(remaining);
      if (activeChatId === chatId) {
        setActiveChatId(remaining[0].id);
      }
    }
  };

  const handleUpdateMessages = (chatId, newMessages) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: newMessages } : c));
  };

  // Count user/bot messages for stats
  const chatMessageCount = chats.reduce((acc, curr) => acc + (curr.messages ? curr.messages.length : 0), 0);

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
              chats={chats}
              activeChatId={activeChatId}
              setActiveChatId={setActiveChatId}
              onNewChat={handleNewChat}
              onRenameChat={handleRenameChat}
              onDeleteChat={handleDeleteChat}
              messages={activeChat ? activeChat.messages : []}
              setMessages={(updater) => {
                const currentMsgs = activeChat ? activeChat.messages : [];
                const updated = typeof updater === 'function' ? updater(currentMsgs) : updater;
                handleUpdateMessages(activeChatId, updated);
              }}
              onSelectDestination={setSelectedDestinationId}
              onGenerateItinerary={handleGenerateItinerary}
              setActiveTab={setActiveTab}
              activeItineraryId={activeItineraryId}
              setActiveItineraryId={setActiveItineraryId}
              currentItinerary={customItineraries[activeItineraryId]}
              getItinerary={(destinationId) => customItineraries[destinationId]}
              onAddActivity={(destinationId, dayNum, time, title, desc) => handleAddItineraryActivity(destinationId, dayNum, time, title, desc)}
              onEditActivity={(destinationId, dayNum, index, time, title, desc) => handleEditItineraryActivity(destinationId, dayNum, index, time, title, desc)}
              onDeleteActivity={(destinationId, dayNum, index) => handleDeleteItineraryActivity(destinationId, dayNum, index)}
            />
          )}

          {activeTab === 'itinerary' && (
            <ItineraryScreen
              activeItineraryId={activeItineraryId}
              itinerary={customItineraries[activeItineraryId]}
              onUpdateItinerary={handleUpdateItinerary}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'account' && (
            <AccountScreen
              chatMessageCount={chatMessageCount}
              itineraryCount={activeItineraryId ? 1 : 0}
            />
          )}

          {/* Floating Destination Details Overlay */}
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
            className={`nav-item nav-explore ${activeTab === 'explore' ? 'active' : ''}`}
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
            className={`nav-item nav-ai ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('chat')
              setSelectedDestinationId(null)
            }}
          >
            <div className="nav-item-icon-wrapper">
              <Sparkles size={20} />
            </div>
            <span>AI</span>
          </button>

          <button
            className={`nav-item nav-itinerary ${activeTab === 'itinerary' ? 'active' : ''}`}
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
            className={`nav-item nav-account ${activeTab === 'account' ? 'active' : ''}`}
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
