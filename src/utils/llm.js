import { getWeatherForecast, searchMockDatabase } from './rag'

let cachedHotels = null;

const recommendationProfiles = {
  phu_quoc: {
    id: 'phu_quoc',
    name: 'Vinpearl Phú Quốc',
    image: '/images/phu_quoc.png',
    highlights: [
      'Phù hợp lịch trình gia đình 3 ngày 2 đêm',
      'Kết hợp nghỉ dưỡng, VinWonders và Safari',
      'Có thể tạo lịch trình cá nhân hóa ngay'
    ]
  },
  nha_trang: {
    id: 'nha_trang',
    name: 'Vinpearl Nha Trang',
    image: '/images/nha_trang.png',
    highlights: [
      'Phù hợp nghỉ dưỡng biển đảo và vui chơi gia đình',
      'Kết hợp cáp treo, VinWonders và trải nghiệm Hòn Tre',
      'Có thể tạo lịch trình cá nhân hóa ngay'
    ]
  },
  hoi_an: {
    id: 'hoi_an',
    name: 'Vinpearl Nam Hội An',
    image: '/images/hoi_an.png',
    highlights: [
      'Phù hợp lịch trình văn hóa, nghỉ dưỡng và vui chơi',
      'Kết hợp VinWonders Nam Hội An và River Safari',
      'Có thể tạo lịch trình cá nhân hóa ngay'
    ]
  },
  ha_long: {
    id: 'ha_long',
    name: 'Vinpearl Hạ Long',
    image: '/images/ha_long.png',
    highlights: [
      'Phù hợp nghỉ dưỡng vịnh biển và tham quan Hạ Long',
      'Kết hợp resort đảo Rều, vịnh và hoạt động gia đình',
      'Có thể tạo lịch trình cá nhân hóa ngay'
    ]
  }
};

const destinationDisplayNames = {
  phu_quoc: 'Phú Quốc',
  nha_trang: 'Nha Trang',
  hoi_an: 'Nam Hội An',
  ha_long: 'Hạ Long',
};

function shouldAttachItineraryRecommendation(userQuery, reply) {
  const text = `${userQuery || ''} ${reply || ''}`.toLowerCase();
  return /lịch trình|lich trinh|kế hoạch|ke hoach|plan|itinerary|3n2đ|3n2d|ngày.*đêm|ngay.*dem|du lịch|du lich|nghỉ dưỡng|nghi duong/.test(text);
}

function normalizeChatItinerary(raw, fallbackTitle = 'Lịch trình từ chat') {
  if (!raw || !Array.isArray(raw.days)) return null;

  const days = raw.days
    .map((day, index) => {
      const events = Array.isArray(day.events)
        ? day.events
            .filter(event => event && (event.title || event.desc))
            .map(event => ({
              time: normalizeToolTime(event.time) || '09:00',
              title: String(event.title || 'Hoạt động').trim(),
              desc: String(event.desc || '').trim(),
            }))
            .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
        : [];

      return {
        dayNum: Number(day.dayNum) || index + 1,
        events,
      };
    })
    .filter(day => day.events.length > 0);

  if (!days.length) return null;

  return {
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : fallbackTitle,
    days,
  };
}

function extractChatItinerary(reply) {
  const text = String(reply || '');
  const match = text.match(/\[ITINERARY_PLAN_JSON\]([\s\S]*?)\[\/ITINERARY_PLAN_JSON\]/);
  if (!match) return { text, itinerary: null };

  let itinerary = null;
  try {
    itinerary = normalizeChatItinerary(JSON.parse(match[1].trim()));
  } catch (error) {
    console.warn('Failed to parse chat itinerary plan JSON:', error);
  }

  return {
    text: text.replace(match[0], '').trim(),
    itinerary,
  };
}

function extractVisibleItinerary(reply, destinationId = 'phu_quoc') {
  const text = String(reply || '');
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const daysByNum = new Map();
  let currentDayNum = null;

  lines.forEach((rawLine) => {
    const line = rawLine
      .replace(/^#{1,4}\s*/, '')
      .replace(/^[-*•]\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .trim();

    const dayMatch = line.match(/^ngày\s*(\d+)\b/i) || line.match(/^day\s*(\d+)\b/i);
    if (dayMatch) {
      currentDayNum = Number(dayMatch[1]);
      if (!daysByNum.has(currentDayNum)) daysByNum.set(currentDayNum, []);
      return;
    }

    const event = parseVisibleItineraryEvent(line);
    if (!event) return;

    const dayNum = currentDayNum || 1;
    currentDayNum = dayNum;
    if (!daysByNum.has(dayNum)) daysByNum.set(dayNum, []);
    daysByNum.get(dayNum).push(event);
  });

  const days = [...daysByNum.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dayNum, events]) => ({
      dayNum,
      events: events.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
    }))
    .filter((day) => day.events.length > 0);

  const eventCount = days.reduce((total, day) => total + day.events.length, 0);
  if (eventCount < 2) return null;

  return {
    title: `Lịch trình từ chat - ${destinationDisplayNames[destinationId] || 'Vinpearl'}`,
    days,
  };
}

function parseVisibleItineraryEvent(line) {
  const match = line.match(/^(\d{1,2})(?::|h)([0-5]\d)\s*(?:[-–—:]\s*)?(.+)$/i);
  if (!match) return null;

  const time = normalizeToolTime(`${match[1]}:${match[2]}`);
  const rest = String(match[3] || '').trim();
  if (!time || !rest) return null;

  const [titlePart, ...descParts] = rest.split(/\s[-–—]\s|:\s/);
  const title = normalizeToolText(titlePart);
  if (!title) return null;

  return {
    time,
    title,
    desc: descParts.join(' - ').trim() || 'Hoạt động được trích từ lịch trình trợ lý đã nêu trong chat.',
  };
}

function buildRecommendation(destinationId, itinerary = null) {
  const profile = recommendationProfiles[destinationId] || recommendationProfiles.phu_quoc;
  return itinerary ? { ...profile, itinerary } : profile;
}

function normalizeToolDay(value) {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 30 ? day : null;
}

function normalizeToolIndex(value) {
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

function normalizeToolTime(value) {
  const match = String(value || '').trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function normalizeToolText(value) {
  const text = String(value || '').trim();
  return text || null;
}

function timeToMinutes(time = '00:00') {
  const [hours = '0', minutes = '0'] = String(time).split(':');
  return Number(hours) * 60 + Number(minutes);
}

// Load hotels_clean.json from public directory
export async function getHotelsDataset() {
  if (cachedHotels) return cachedHotels;
  try {
    const response = await fetch('/data-mooc/hotels_clean.json');
    if (response.ok) {
      cachedHotels = await response.json();
      return cachedHotels;
    }
  } catch (e) {
    console.error('Failed to load hotels_clean.json', e);
  }
  return [];
}

// Search hotels database (RAG)
export async function searchHotelsDatabase(query) {
  const hotels = await getHotelsDataset();
  const queryLower = query.toLowerCase();

  // Keyword match
  let matches = hotels.filter(h => {
    return h.name.toLowerCase().includes(queryLower) ||
           h.location.toLowerCase().includes(queryLower) ||
           h.description.toLowerCase().includes(queryLower) ||
           h.slug.toLowerCase().includes(queryLower) ||
           (h.tagline && h.tagline.toLowerCase().includes(queryLower));
  });

  // If no match found, fallback to destination broad match
  if (matches.length === 0) {
    let destKeyword = '';
    if (queryLower.includes('phú quốc') || queryLower.includes('phu quoc')) destKeyword = 'phu-quoc';
    else if (queryLower.includes('nha trang')) destKeyword = 'nha-trang';
    else if (queryLower.includes('hội an') || queryLower.includes('nam hội an') || queryLower.includes('hoi an')) destKeyword = 'nam-hoi-an';
    else if (queryLower.includes('hạ long') || queryLower.includes('ha long')) destKeyword = 'ha-long';
    else if (queryLower.includes('hòn tằm') || queryLower.includes('hon tam')) destKeyword = 'hon-tam';

    if (destKeyword) {
      matches = hotels.filter(h => h.slug.includes(destKeyword) || h.location.toLowerCase().includes(destKeyword.replace('-', ' ')));
    }
  }

  return matches;
}

// Map destination ID to weather location string
const weatherLocMap = {
  phu_quoc: 'phu_quoc',
  nha_trang: 'nha_trang',
  hoi_an: 'hoi_an',
  ha_long: 'ha_long'
};

// Main RAG context generation helper
export async function getRAGContext(query, destinationId = 'phu_quoc') {
  const matchedHotels = await searchHotelsDatabase(query);
  let context = 'Cơ sở dữ liệu Vinpearl hiện tại:\n';

  try {
    const mockResult = await searchMockDatabase(query, destinationId);
    if (mockResult?.found) {
      context += `\n📌 ${mockResult.title || 'Dữ liệu nghiệp vụ Vinpearl'}:\n${mockResult.content}\n`;
    }
  } catch (error) {
    console.warn('Could not load MOOC mock context', error);
  }

  if (matchedHotels.length > 0) {
    matchedHotels.slice(0, 2).forEach(h => {
      context += `\n🏨 Khách sạn: ${h.name}\n`;
      context += `• Địa điểm: ${h.location}\n`;
      context += `• Tagline: ${h.tagline || 'N/A'}\n`;
      context += `• Mô tả: ${h.description}\n`;
      
      if (h.room_types && h.room_types.length > 0) {
        context += `• Loại phòng:\n`;
        h.room_types.slice(0, 3).forEach(r => {
          context += `  - ${r.name}: Giá từ $${r.price_from_usd || 'N/A'}/đêm, Diện tích: ${r.size_m2 || 'N/A'}m2, Amenities: ${(r.amenities || []).slice(0, 5).join(', ')}\n`;
        });
      }

      if (h.dining && h.dining.length > 0) {
        context += `• Nhà hàng & Ẩm thực: ${h.dining.join(', ')}\n`;
      }

      if (h.experiences && h.experiences.length > 0) {
        context += `• Trải nghiệm khám phá: ${h.experiences.map(e => e.name).join(', ')}\n`;
      }

      // Provide local/live image paths for LLM to select from
      if (h.local_images && h.local_images.length > 0) {
        // Map "dataset/images/" to "/dataset/images/" to match dev server pathing
        const formattedImages = h.local_images
          .slice(0, 3)
          .map(img => img.startsWith('dataset/') ? '/' + img : img);
        context += `• Hình ảnh thực tế (hãy chọn một hoặc hai link này để hiển thị dạng markdown if relevant): ${formattedImages.join(', ')}\n`;
      } else if (h.images && h.images.length > 0) {
        context += `• Hình ảnh thực tế: ${h.images.slice(0, 2).join(', ')}\n`;
      }
    });
  } else {
    context += `Không tìm thấy khách sạn cụ thể nào trong cơ sở dữ liệu cho từ khóa "${query}". Bạn có thể tư vấn chung hoặc sử dụng tool để tìm kiếm.\n`;
  }

  // Fetch weather forecast if relevant
  try {
    const weatherData = await getWeatherForecast(destinationId);
    if (weatherData && weatherData.length > 0) {
      context += `\n🌤️ Thời tiết dự báo tại ${destinationId.toUpperCase()}:\n`;
      weatherData.slice(0, 3).forEach(w => {
        context += `- Ngày ${w.date}: ${w.temperatureMinC}°C - ${w.temperatureMaxC}°C, Mưa: ${w.rainProb}%, Khuyến nghị: ${w.recommendation}\n`;
      });
    }
  } catch (err) {
    console.warn('Could not load weather context', err);
  }

  return context;
}

// Invoke custom LLM completions API
export async function executeLLMChat(messages, systemPrompt = '') {
  try {
    const response = await fetch('/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        systemPrompt,
        temperature: 0.7,
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.content) return data.content;
      if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    }
  } catch (error) {
    console.warn('Server-side LLM gateway is unavailable.', error);
  }

  return null;
}

// Orchestrator for RAG AI Agent with Tool Calling
export async function runAIAgentResponse(
  userQuery,
  chatHistory,
  destinationId,
  currentItinerary,
  itineraryCallbacks = {},
  options = {}
) {
  // 1. Gather context details
  const ragContext = await getRAGContext(userQuery, destinationId);

  // Destination coordinates for Google Maps
  const destMapLinks = {
    phu_quoc: 'https://www.google.com/maps/search/Vinpearl+Phu+Quoc/@10.3333,103.8333,13z',
    nha_trang: 'https://www.google.com/maps/search/Vinpearl+Nha+Trang/@12.2388,109.1967,13z',
    hoi_an: 'https://www.google.com/maps/search/Vinpearl+Nam+Hoi+An/@15.8801,108.3380,13z',
    ha_long: 'https://www.google.com/maps/search/Vinpearl+Ha+Long/@20.9101,107.1839,13z',
  };
  const mapLink = destMapLinks[destinationId] || destMapLinks.phu_quoc;

  // 2. Prepare tool prompt
  const toolsEnabled = options.toolsEnabled !== false;
  const toolInstructions = toolsEnabled
    ? `**TOOL CALLING - Cập nhật lịch trình:**
In cú pháp sau ở CUỐI câu trả lời (dòng riêng biệt) khi muốn thay đổi lịch trình:
- Thêm: [TOOL_CALL: add_activity, {"day": 1, "time": "14:30", "title": "Tên hoạt động", "desc": "Mô tả"}]
- Sửa: [TOOL_CALL: edit_activity, {"day": 1, "index": 0, "time": "09:00", "title": "Tên mới", "desc": "Mô tả mới"}]
- Xóa: [TOOL_CALL: delete_activity, {"day": 1, "index": 0}]`
    : `**TRẠNG THÁI LỊCH TRÌNH: ĐÃ CHỐT**
Bạn không được thêm, sửa hoặc xóa lịch trình trong cuộc trò chuyện này. Nếu khách muốn thay đổi lịch, hãy nói khách mở lại chế độ chỉnh sửa trước rồi mới yêu cầu điều chỉnh. Không in TOOL_CALL.`;

  const systemPrompt = `Bạn là Vinpearl AI, trợ lý du lịch 5 sao thông minh của hệ thống Vinpearl Resort.
Nhiệm vụ: hỗ trợ du khách tìm hiểu địa điểm, đặt phòng và lên lịch trình nghỉ dưỡng tại Phú Quốc, Nha Trang, Nam Hội An và Hạ Long.

**QUY TẮC TRẢ LỜI:**
1. Luôn trả lời bằng tiếng Việt, giọng điệu thân thiện, chuyên nghiệp.
2. Khi giới thiệu địa điểm/resort, BẮT BUỘC phải:
   - Hiển thị 1-2 hình ảnh thực tế bằng cú pháp markdown: ![Tên ảnh](URL) trên dòng riêng biệt
   - Kèm link Google Maps: [📍 Xem vị trí trên Google Maps](${mapLink})
3. Ưu tiên dùng ảnh từ phần "Hình ảnh thực tế" trong context (đường dẫn /dataset/images/... hoặc https://statics.vinpearl.com/)
4. Khi người dùng hỏi về lịch trình, hãy hỏi các thông tin: số người (bao gồm trẻ em), số ngày, ngân sách, sở thích để lên lịch phù hợp.
5. Nếu người dùng cung cấp đủ thông tin (số người, ngày, điểm đến), hãy gợi ý lịch trình chi tiết theo từng ngày.
6. Khi đã gợi ý được lịch trình cụ thể có ngày, giờ và hoạt động, hãy thêm một block JSON ở CUỐI câu trả lời theo đúng dạng:
[ITINERARY_PLAN_JSON]{"title":"string","days":[{"dayNum":1,"events":[{"time":"HH:MM","title":"string","desc":"string"}]}]}[/ITINERARY_PLAN_JSON]
Block này dùng để chuyển plan từ chat sang tab Lịch trình. Không giải thích block này trong câu trả lời.

**DỮ LIỆU BỐI CẢNH (RAG):**
${ragContext}

**LỊCH TRÌNH HIỆN TẠI:**
${currentItinerary ? JSON.stringify(currentItinerary, null, 2) : 'Chưa có lịch trình. Hỏi thông tin khách để lên kế hoạch.'}

${toolInstructions}

Chú ý: Phản hồi hoàn toàn bằng tiếng Việt với giọng điệu hiếu khách, trang trọng.`;

  // 3. Format history messages
  const apiMessages = chatHistory.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  // ChatScreen passes the current user message in chatHistory; keep this
  // idempotent for direct callers that pass only previous messages.
  if (apiMessages[apiMessages.length - 1]?.content !== userQuery) {
    apiMessages.push({ role: 'user', content: userQuery });
  }

  // 4. Invoke LLM
  let reply = await executeLLMChat(apiMessages, systemPrompt);

  if (!reply) {
    return {
      text: 'Xin lỗi bạn, kết nối đến máy chủ AI hiện tại đang gặp sự cố. Dưới đây là thông tin cứu trợ:\n\n' + ragContext,
      recommendation: null
    };
  }

  // 5. Parse one or many tool calls, then strip them from visible chat text.
  const extractedItinerary = extractChatItinerary(reply);
  reply = extractedItinerary.text;
  const visibleItinerary = extractedItinerary.itinerary
    ? null
    : extractVisibleItinerary(reply, destinationId);

  const toolCallRegex = /\[TOOL_CALL:\s*([a-zA-Z0-9_]+)\s*,\s*({[\s\S]*?})\]/g;
  const toolCalls = [...reply.matchAll(toolCallRegex)];
  let itineraryWasUpdated = false;

  toolCalls.forEach(match => {
    const toolName = match[1];
    const toolArgsStr = match[2];

    try {
      const args = JSON.parse(toolArgsStr);
      console.log(`AI Agent executing tool: ${toolName}`, args);

      if (!toolsEnabled) {
        return;
      }

      const day = normalizeToolDay(args.day);
      const index = normalizeToolIndex(args.index);
      const time = normalizeToolTime(args.time);
      const title = normalizeToolText(args.title);
      const desc = normalizeToolText(args.desc) || '';

      if (toolName === 'add_activity' && itineraryCallbacks.addActivity && day && time && title) {
        itineraryWasUpdated = Boolean(itineraryCallbacks.addActivity(day, time, title, desc)) || itineraryWasUpdated;
      } else if (toolName === 'edit_activity' && itineraryCallbacks.editActivity) {
        if (day && index != null && time && title) {
          itineraryWasUpdated = Boolean(itineraryCallbacks.editActivity(day, index, time, title, desc)) || itineraryWasUpdated;
        }
      } else if (toolName === 'delete_activity' && itineraryCallbacks.deleteActivity) {
        if (day && index != null) {
          itineraryWasUpdated = Boolean(itineraryCallbacks.deleteActivity(day, index)) || itineraryWasUpdated;
        }
      }
    } catch (e) {
      console.error('Failed to parse or run AI tool call arguments:', e);
    }
  });

  if (toolCalls.length > 0) {
    reply = reply.replace(toolCallRegex, '').trim();
    if (!toolsEnabled) {
      const lockedNote = 'Lịch trình đã được chốt. Bạn vui lòng mở lại chỉnh sửa trước khi yêu cầu thay đổi lịch.';
      reply = reply ? `${reply}\n\n*(Hệ thống: ${lockedNote})*` : lockedNote;
    } else if (itineraryWasUpdated) {
      reply += '\n\n*(Hệ thống: Trợ lý AI đã cập nhật tab Lịch trình đúng theo điểm đến trong cuộc chat.)*';
    } else if (toolsEnabled) {
      const invalidNote = '*(Hệ thống: Chưa cập nhật lịch trình vì ngày, giờ hoặc vị trí hoạt động không hợp lệ.)*';
      reply = reply ? `${reply}\n\n${invalidNote}` : invalidNote;
    }
  }

  return {
    text: reply,
    recommendation: extractedItinerary.itinerary || visibleItinerary || shouldAttachItineraryRecommendation(userQuery, reply)
      ? buildRecommendation(destinationId, extractedItinerary.itinerary || visibleItinerary)
      : null
  };
}

// Optimization Suggestions Generator for Itineraries
export async function getItineraryOptimizationSuggestions(destinationId, itinerary, weatherForecast) {
  const systemPrompt = `Bạn là Trợ lý AI Tối ưu hóa Lịch trình của Vinpearl.
Nhiệm vụ của bạn là phân tích lịch trình nghỉ dưỡng và dự báo thời tiết của khách hàng để đưa ra các gợi ý điều chỉnh tối ưu nhất (đặc biệt là đề xuất phương án tránh mưa nếu khả năng mưa cao > 50%, tránh nắng gắt, hoặc gợi ý nhà hàng ẩm thực/trải nghiệm phù hợp trong dataset).

Hãy phản hồi ngắn gọn, rõ ràng theo cấu trúc sau:
1. **Đánh giá chung**: Nhận xét về sự phân bổ thời gian và tính hợp lý của lịch trình hiện tại.
2. **Khuyến nghị thời tiết**: Phân tích cụ thể dự báo mưa/nắng của 3 ngày và đề xuất thay đổi các hoạt động ngoài trời sang hoạt động trong nhà (như Spa, nhà hàng ẩm thực, show diễn Tata) nếu cần thiết.
3. **Đề xuất nâng cấp**: Đề xuất thêm 1-2 dịch vụ cao cấp từ Vinpearl (Akoya Spa, Grand World, nhà hàng buffet đặc sản) phù hợp với nhóm khách.

Chú ý: Phản hồi hoàn toàn bằng tiếng Việt với định dạng markdown rõ ràng, súc tích.`;

  const userPrompt = `Quần thể điểm đến: ${destinationId}
Lịch trình hiện tại: ${JSON.stringify(itinerary)}
Dự báo thời tiết chi tiết: ${JSON.stringify(weatherForecast)}`;

  const messages = [{ role: 'user', content: userPrompt }];
  return await executeLLMChat(messages, systemPrompt);
}
