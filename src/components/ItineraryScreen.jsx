import React, { useState } from 'react'
import { Calendar, Download, Map, ArrowRight } from 'lucide-react'

export const itinerariesData = {
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

export default function ItineraryScreen({ activeItineraryId, setActiveTab }) {
  const [activeDay, setActiveDay] = useState(1)

  const itinerary = itinerariesData[activeItineraryId]

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

  const currentDayData = itinerary.days.find(d => d.dayNum === activeDay) || itinerary.days[0]

  return (
    <div className="tab-view">
      {/* Header matching Screen 4 */}
      <div className="itinerary-header">
        <div className="chat-avatar-wrapper" style={{ width: '32px', height: '32px' }}>
          <img src="/images/ai_avatar.png" alt="AI" className="chat-avatar" />
        </div>
        <div className="itinerary-header-info">
          <h2 className="itinerary-title">Lịch trình 3N2Đ</h2>
          <p className="itinerary-subtitle">{itinerary.title}</p>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="itinerary-days-row">
        {itinerary.days.map(d => (
          <button
            key={d.dayNum}
            className={`itinerary-day-tab ${activeDay === d.dayNum ? 'active' : ''}`}
            onClick={() => setActiveDay(d.dayNum)}
          >
            Ngày {d.dayNum}
          </button>
        ))}
      </div>

      {/* Scrollable Timeline */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="timeline-container">
          <div className="timeline-line"></div>

          {/* Group Header for Day */}
          <div className="timeline-event section-header">
            <div className="timeline-time"></div>
            <div className="timeline-node-container">
              <div className="timeline-node"></div>
            </div>
            <span className="timeline-section-title">Ngày {activeDay}</span>
          </div>

          {currentDayData.events.map((evt, idx) => (
            <div key={idx} className="timeline-event">
              <div className="timeline-time">{evt.time}</div>
              <div className="timeline-node-container">
                <div className="timeline-node"></div>
              </div>
              <div className="timeline-card">
                <h4 className="timeline-card-title">{evt.title}</h4>
                <p className="timeline-card-desc">{evt.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="itinerary-footer">
        <button className="itinerary-save-btn" onClick={() => alert('Đã lưu lịch trình thành công vào máy của bạn!')}>
          <Download size={16} /> Lưu lịch trình
        </button>
      </div>
    </div>
  )
}
