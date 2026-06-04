import { getWeatherForecast } from './rag'

// Environment variables loaded by Vite
const API_KEY = import.meta.env.VITE_CUSTOM_LLM_KEY || '';
const BASE_URL = import.meta.env.VITE_CUSTOM_LLM_BASE_URL || '/api-llm/zen/go/v1';
const MODEL_NAME = import.meta.env.VITE_CUSTOM_LLM_MODEL || 'deepseek-v4-flash';

let cachedHotels = null;

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
  if (!API_KEY) {
    console.warn('VITE_CUSTOM_LLM_KEY is not configured; skipping browser LLM call.');
    return null;
  }

  const url = `${BASE_URL.replace(/\/$/, '')}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  };

  const payload = {
    model: MODEL_NAME,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.7
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`LLM call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error invoking DeepSeek LLM:', error);
    return null;
  }
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

  // 2. Prepare tool prompt
  const toolsEnabled = options.toolsEnabled !== false;
  const toolInstructions = toolsEnabled
    ? `**KHẢ NĂNG GỌI TOOL (ACTION CALLING):**
Bạn có quyền thay đổi lịch trình du lịch của khách hàng bằng cách thêm, sửa hoặc xóa các hoạt động. Để gọi tool, bạn hãy in cú pháp sau ở CHÓT CÙNG của câu trả lời trên một dòng riêng biệt:
- Thêm hoạt động: [TOOL_CALL: add_activity, {"day": 1, "time": "14:30", "title": "Hoạt động", "desc": "Mô tả"}]
- Sửa hoạt động: [TOOL_CALL: edit_activity, {"day": 2, "index": 0, "time": "09:00", "title": "Hoạt động mới", "desc": "Mô tả mới"}]
- Xóa hoạt động: [TOOL_CALL: delete_activity, {"day": 1, "index": 2}]

Ví dụ: Nếu khách yêu cầu "Thêm tắm biển vào chiều ngày 1 lúc 16h30", bạn trả lời xác nhận và in ở cuối:
[TOOL_CALL: add_activity, {"day": 1, "time": "16:30", "title": "Tắm biển Bãi Dài", "desc": "Thư giãn bơi lội tại bãi biển cát trắng."}]`
    : `**TRẠNG THÁI LỊCH TRÌNH: ĐÃ CHỐT**
Bạn không được thêm, sửa hoặc xóa lịch trình trong cuộc trò chuyện này. Nếu khách muốn thay đổi lịch, hãy nói khách mở lại chế độ chỉnh sửa trước rồi mới yêu cầu điều chỉnh. Không in TOOL_CALL.`;

  const systemPrompt = `Bạn là Vinpearl AI, một trợ lý du lịch 5 sao thông minh.
Nhiệm vụ của bạn là hỗ trợ du khách lên lịch trình nghỉ dưỡng tại 4 quần thể: Phú Quốc, Nha Trang, Nam Hội An và Hạ Long.

Hãy trả lời dựa trên thông tin thực tế từ cơ sở dữ liệu Vinpearl được cung cấp.
Nếu có link hình ảnh trong phần context, bạn HÃY THÊM hình ảnh đó vào câu trả lời bằng cú pháp markdown: ![Tên ảnh](URL_ảnh) trên dòng riêng biệt. Sử dụng các đường dẫn bắt đầu bằng "/dataset/images/" hoặc "https://statics.vinpearl.com/".

**DỮ LIỆU BỐI CẢNH (RAG):**
${ragContext}

**CHI TIẾT LỊCH TRÌNH HIỆN TẠI CỦA NGƯỜI DÙNG:**
${currentItinerary ? JSON.stringify(currentItinerary) : 'Chưa có lịch trình.'}

${toolInstructions}

Chú ý: Phản hồi hoàn toàn bằng tiếng Việt với giọng điệu hiếu khách, trang trọng.`;

  // 3. Format history messages
  const apiMessages = chatHistory.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));

  // Append current user message
  apiMessages.push({ role: 'user', content: userQuery });

  // 4. Invoke LLM
  let reply = await executeLLMChat(apiMessages, systemPrompt);

  if (!reply) {
    return {
      text: 'Xin lỗi bạn, kết nối đến máy chủ AI hiện tại đang gặp sự cố. Dưới đây là thông tin cứu trợ:\n\n' + ragContext,
      recommendation: null
    };
  }

  // 5. Parse tool calls
  const toolCallRegex = /\[TOOL_CALL:\s*([a-zA-Z0-9_]+)\s*,\s*({.*})\]/;
  const match = reply.match(toolCallRegex);

  if (match) {
    const toolName = match[1];
    const toolArgsStr = match[2];

    try {
      const args = JSON.parse(toolArgsStr);
      console.log(`AI Agent executing tool: ${toolName}`, args);

      // Remove the raw tool call output from the reply text shown to user
      reply = reply.replace(toolCallRegex, '').trim();

      // Trigger respective callback to update state
      if (!toolsEnabled) {
        return {
          text: reply.replace(toolCallRegex, '').trim() || 'Lịch trình đã được chốt. Bạn vui lòng mở lại chỉnh sửa trước khi yêu cầu thay đổi lịch.',
          recommendation: null
        };
      }

      if (toolName === 'add_activity' && itineraryCallbacks.addActivity) {
        itineraryCallbacks.addActivity(args.day, args.time, args.title, args.desc);
        reply += '\n\n*(Hệ thống: Trợ lý AI đã thêm hoạt động này vào tab Lịch trình của bạn!)*';
      } else if (toolName === 'edit_activity' && itineraryCallbacks.editActivity) {
        itineraryCallbacks.editActivity(args.day, args.index, args.time, args.title, args.desc);
        reply += '\n\n*(Hệ thống: Trợ lý AI đã cập nhật hoạt động này trong Lịch trình của bạn!)*';
      } else if (toolName === 'delete_activity' && itineraryCallbacks.deleteActivity) {
        itineraryCallbacks.deleteActivity(args.day, args.index);
        reply += '\n\n*(Hệ thống: Trợ lý AI đã xóa hoạt động này khỏi Lịch trình của bạn!)*';
      }
    } catch (e) {
      console.error('Failed to parse or run AI tool call arguments:', e);
    }
  }

  return {
    text: reply,
    recommendation: null
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
