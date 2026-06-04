// Mapping destination IDs in app state to folder names in public/data-mooc
const destinationFolderMap = {
  phu_quoc: 'phu-quoc',
  nha_trang: 'nha-trang',
  hoi_an: 'nam-hoi-an',
  ha_long: 'ha-long'
};

const destinationNameMap = {
  phu_quoc: 'Phú Quốc',
  nha_trang: 'Nha Trang',
  hoi_an: 'Nam Hội An',
  ha_long: 'Hạ Long'
};

// Helper to format currency
const formatVND = (number) => {
  if (!number) return 'N/A';
  return number.toLocaleString('vi-VN') + ' đ';
};

// Main search/retrieval engine for client RAG
export async function searchMockDatabase(query, destinationId = 'phu_quoc') {
  const queryLower = query.toLowerCase();
  const folder = destinationFolderMap[destinationId] || 'phu-quoc';
  const destName = destinationNameMap[destinationId] || 'Phú Quốc';

  try {
    // 1. WEATHER INTENT ("thời tiết", "mưa", "nắng", "nhiệt độ", "forecast")
    if (queryLower.includes('thời tiết') || queryLower.includes('mưa') || queryLower.includes('nắng') || queryLower.includes('nhiệt độ') || queryLower.includes('weather')) {
      const response = await fetch(`/data-mooc/${folder}/mock/weather-forecast.json`);
      if (!response.ok) throw new Error('Failed to fetch weather');
      const weatherData = await response.json();

      // Look for a date in query (e.g. 04/06 or 05/06 or 2026-06-04)
      // Standardize date matching (our data contains dates from 2026-06-04 to 2026-07-04)
      let matchedDay = null;
      
      // Simple date extraction regex matching formats like "04/06", "04-06", "4/6", "2026-06-04"
      const dateRegex = /(\d{1,2})[\/\-](\d{1,2})/;
      const match = queryLower.match(dateRegex);
      
      if (match) {
        let day = match[1].padStart(2, '0');
        let month = match[2].padStart(2, '0');
        let searchDate = `2026-${month}-${day}`;
        matchedDay = weatherData.find(w => w.date === searchDate);
      }
      
      // If no date found in query, default to today (2026-06-04) or next days
      if (!matchedDay) {
        matchedDay = weatherData[0]; // First item is 2026-06-04
      }

      if (matchedDay) {
        const weatherIcons = {
          sunny: '☀️ Nắng đẹp',
          cloudy: '☁️ Nhiều mây',
          light_rain: '🌧️ Mưa nhỏ',
          heavy_rain: '⛈️ Mưa dông lớn',
          very_hot: '🔥 Rất nóng'
        };

        const weatherName = weatherIcons[matchedDay.weather] || matchedDay.weather;
        return {
          found: true,
          type: 'weather',
          title: `Dự báo thời tiết ${destName} ngày ${matchedDay.date}`,
          content: `• Trạng thái: ${weatherName}\n• Nhiệt độ: ${matchedDay.temperatureMinC}°C - ${matchedDay.temperatureMaxC}°C\n• Khả năng mưa: ${matchedDay.rainProb}%\n• Tốc độ gió: ${matchedDay.windKmh} km/h\n• Khuyến nghị của Vinpearl AI: ${matchedDay.recommendation}`,
          raw: matchedDay
        };
      }
    }

    // 2. FLIGHT INTENT ("chuyến bay", "vé máy bay", "bay từ", "hàng không", "lịch bay", "flight")
    if (queryLower.includes('chuyến bay') || queryLower.includes('vé máy bay') || queryLower.includes('bay từ') || queryLower.includes('hàng không') || queryLower.includes('bay tới') || queryLower.includes('lịch bay')) {
      const response = await fetch(`/data-mooc/${folder}/mock/flights.json`);
      if (!response.ok) throw new Error('Failed to fetch flights');
      const flightsData = await response.json();

      // Find flights matching origin (e.g. Hà Nội, Sài Gòn, HCM)
      let origin = 'Hà Nội'; // Default origin search
      if (queryLower.includes('hồ chí minh') || queryLower.includes('hcm') || queryLower.includes('sài gòn') || queryLower.includes('sg')) {
        origin = 'Hồ Chí Minh';
      } else if (queryLower.includes('đà nẵng') || queryLower.includes('đn')) {
        origin = 'Đà Nẵng';
      }

      // Filter flights
      const matchedFlights = flightsData
        .filter(f => f.origin.toLowerCase().includes(origin.toLowerCase()) || f.destination.toLowerCase().includes(destName.toLowerCase()))
        .slice(0, 4); // Limit to top 4 flights for clean presentation

      if (matchedFlights.length > 0) {
        const flightsList = matchedFlights.map(f => 
          `✈️ **${f.flightNumber}** (${f.airline})\n  • Lộ trình: ${f.origin} ➔ ${f.destination}\n  • Khởi hành: ${f.departureTime} | Giá vé: ${formatVND(f.priceEconomy || f.price || 1500000)}`
        ).join('\n\n');

        return {
          found: true,
          type: 'flights',
          title: `Lịch trình chuyến bay từ ${origin} đi ${destName}`,
          content: flightsList
        };
      }
    }

    // 3. HOTEL & ROOM INTENT ("khách sạn", "phòng deluxe", "giá phòng", "ở đâu", "hotel", "phòng villa")
    if (queryLower.includes('khách sạn') || queryLower.includes('phòng') || queryLower.includes('giá phòng') || queryLower.includes('ở đâu') || queryLower.includes('hotel') || queryLower.includes('villa') || queryLower.includes('resort')) {
      const responseHotels = await fetch(`/data-mooc/${folder}/mock/hotels.json`);
      if (!responseHotels.ok) throw new Error('Failed to fetch hotels');
      const hotels = await responseHotels.json();

      // If user asks about a specific hotel or wants list
      let matchedHotels = hotels;
      
      // Check if user named a specific hotel
      const specificHotel = hotels.find(h => queryLower.includes(h.name.toLowerCase()) || queryLower.includes(h.id.split('_')[1]));
      if (specificHotel) {
        matchedHotels = [specificHotel];
      }

      // Fetch room rates if available
      let roomsInfo = '';
      try {
        const responseRooms = await fetch(`/data-mooc/${folder}/mock/rooms.json`);
        if (responseRooms.ok) {
          const rooms = await responseRooms.json();
          roomsInfo = '\n\n**Bảng giá phòng tham khảo:**\n' + rooms.slice(0, 3).map(r => 
            `• ${r.name || r.type}: Chỉ từ ${formatVND(r.basePrice || r.price || 2200000)}/đêm`
          ).join('\n');
        }
      } catch (e) {
        console.warn('Rooms file not found', e);
      }

      const hotelsList = matchedHotels.map(h => 
        `🏨 **${h.name}** (Hạng ${h.tier} sao)\n  • Khu vực: ${h.zone}\n  • Điểm cộng: ${h.note || 'Không gian yên bình đẳng cấp'}\n  • Thích hợp cho gia đình: ${Math.round(h.familyFit * 100)}% | Cặp đôi: ${Math.round(h.coupleFit * 100)}%`
      ).join('\n\n');

      return {
        found: true,
        type: 'hotels',
        title: `Thông tin khách sạn & resort tại ${destName}`,
        content: hotelsList + roomsInfo
      };
    }

    // 4. RESTAURANT INTENT ("ăn gì", "nhà hàng", "ẩm thực", "ăn tối", "buffet", "hải sản")
    if (queryLower.includes('ăn gì') || queryLower.includes('nhà hàng') || queryLower.includes('ẩm thực') || queryLower.includes('ăn tối') || queryLower.includes('buffet') || queryLower.includes('hải sản') || queryLower.includes('ăn uống')) {
      const response = await fetch(`/data-mooc/${folder}/mock/restaurants.json`);
      if (!response.ok) throw new Error('Failed to fetch restaurants');
      const restaurants = await response.json();

      let matchedRest = restaurants;
      // Search keywords like "hải sản" or "buffet"
      if (queryLower.includes('hải sản')) {
        matchedRest = restaurants.filter(r => r.cuisine.toLowerCase().includes('hải sản') || r.description?.toLowerCase().includes('hải sản'));
      } else if (queryLower.includes('buffet')) {
        matchedRest = restaurants.filter(r => r.type?.toLowerCase().includes('buffet') || r.name.toLowerCase().includes('buffet') || r.cuisine.toLowerCase().includes('buffet'));
      }

      // Default back to first few if none found
      if (matchedRest.length === 0) matchedRest = restaurants;
      matchedRest = matchedRest.slice(0, 3); // Limit to top 3

      const restList = matchedRest.map(r => 
        `🍽️ **${r.name}**\n  • Loại ẩm thực: ${r.cuisine || r.type}\n  • Vị trí: ${r.zone || 'Khu Resort'}\n  • Mô tả: ${r.note || r.description || 'Thưởng thức tinh hoa ẩm thực trong không gian sang trọng.'}`
      ).join('\n\n');

      return {
        found: true,
        type: 'restaurants',
        title: `Gợi ý ẩm thực & nhà hàng tại ${destName}`,
        content: restList
      };
    }

    // 5. ATTRACTIONS INTENT ("chơi gì", "giải trí", "vinwonders", "safari", "aquarium", "vé", "địa điểm chơi")
    if (queryLower.includes('chơi gì') || queryLower.includes('giải trí') || queryLower.includes('vinwonders') || queryLower.includes('safari') || queryLower.includes('công viên') || queryLower.includes('aquarium') || queryLower.includes('vé') || queryLower.includes('địa điểm chơi') || queryLower.includes('tham quan')) {
      const response = await fetch(`/data-mooc/${folder}/mock/attractions.json`);
      if (!response.ok) throw new Error('Failed to fetch attractions');
      const attractions = await response.json();

      let matchedAttr = attractions;
      if (queryLower.includes('safari')) {
        matchedAttr = attractions.filter(a => a.park.toLowerCase().includes('safari'));
      } else if (queryLower.includes('vinwonders') || queryLower.includes('wonders')) {
        matchedAttr = attractions.filter(a => a.park.toLowerCase().includes('vinwonders'));
      } else if (queryLower.includes('grand world') || queryLower.includes('grandworld')) {
        matchedAttr = attractions.filter(a => a.park.toLowerCase().includes('grandworld') || a.park.toLowerCase().includes('grand world'));
      }

      matchedAttr = matchedAttr.slice(0, 4); // Limit to top 4

      const attrList = matchedAttr.map(a => 
        `🎡 **${a.name}** (${a.park})\n  • Giờ mở cửa: ${a.openHours.join(' - ')}\n  • Phân khu: ${a.zone}\n  • Tránh mưa: ${a.indoor ? '✅ Phù hợp chơi khi mưa' : '❌ Hạn chế khi mưa (ngoài trời)'}\n  • Thời gian khuyên dùng: ${a.avgDurationMin} phút`
      ).join('\n\n');

      return {
        found: true,
        type: 'attractions',
        title: `Hoạt động vui chơi giải trí nổi bật tại ${destName}`,
        content: attrList
      };
    }

  } catch (err) {
    console.error('Error fetching mock RAG data:', err);
  }

  // Fallback if not matched or error
  return {
    found: false,
    content: ''
  };
}

// Coordinates mapping for Vinpearl destinations
const destinationCoordinates = {
  phu_quoc: { lat: 10.33, lon: 103.86 },
  nha_trang: { lat: 12.21, lon: 109.21 },
  hoi_an: { lat: 15.83, lon: 108.38 },
  ha_long: { lat: 20.94, lon: 107.08 }
};

// Fetch forecast for weather integration in Itinerary Screen
export async function getWeatherForecast(destinationId) {
  const coords = destinationCoordinates[destinationId] || destinationCoordinates.phu_quoc;
  const folder = destinationFolderMap[destinationId] || 'phu-quoc';

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=Asia/Ho_Chi_Minh`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API request failed');
    const weatherResult = await res.json();
    const daily = weatherResult.daily;
    
    if (daily && daily.time) {
      return daily.time.slice(0, 3).map((timeStr, idx) => {
        const code = daily.weather_code[idx];
        let weather = 'sunny';
        if (code === 0) weather = 'sunny';
        else if (code >= 1 && code <= 3) weather = 'cloudy';
        else if ((code >= 51 && code <= 65) || (code >= 80 && code <= 82)) weather = 'light_rain';
        else if (code >= 95) weather = 'heavy_rain';
        
        const tempMax = Math.round(daily.temperature_2m_max[idx]);
        const tempMin = Math.round(daily.temperature_2m_min[idx]);
        const rainProb = daily.precipitation_probability_max[idx] || 0;
        
        let recommendation = "Thời tiết lý tưởng cho mọi hoạt động ngoài trời. Hãy đi Safari, tắm biển hoặc check-in Grand World!";
        if (rainProb > 50) {
          recommendation = "Dự báo có mưa. Vinpearl AI khuyên bạn dời hoạt động ngoài trời sang trong nhà như Akoya Spa hoặc khu vui chơi trong nhà.";
        } else if (tempMax > 35) {
          recommendation = "Trời nắng nóng gay gắt. Tránh hoạt động ngoài trời quá sức vào giờ trưa, nên nghỉ ngơi bãi biển râm mát.";
        }

        return {
          date: timeStr,
          weather,
          temperatureMinC: tempMin,
          temperatureMaxC: tempMax,
          rainProb,
          windKmh: 10,
          recommendation
        };
      });
    }
  } catch (err) {
    console.warn('Real-time weather API error, falling back to mock files:', err);
  }

  // Fallback to local files
  try {
    const response = await fetch(`/data-mooc/${folder}/mock/weather-forecast.json`);
    if (response.ok) {
      const data = await response.json();
      return data.slice(0, 3);
    }
  } catch (e) {
    console.error('Failed to get fallback weather forecast', e);
  }
  return null;
}
