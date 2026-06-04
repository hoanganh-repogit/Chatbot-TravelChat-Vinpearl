// ============================================================
// ĐIỂM GÃY (SEAM) AI CHO LUỒNG ĐẶT LỊCH TRÌNH
// Tập trung mọi nơi cần "đưa AI vào" phần lập kế hoạch lịch trình.
// Mỗi hàm: gọi LLM thật (qua executeLLMChat) + LUÔN có fallback an toàn,
// nên UI/demo không bao giờ vỡ khi AI lỗi hoặc quá hạn.
// ============================================================
import { executeLLMChat, getRAGContext, getItineraryOptimizationSuggestions } from './llm'

const destinationNames = {
  phu_quoc: 'Phú Quốc',
  nha_trang: 'Nha Trang',
  hoi_an: 'Nam Hội An',
  ha_long: 'Hạ Long',
}

const GENERATE_TIMEOUT_MS = 18000
const SUGGEST_TIMEOUT_MS = 12000

// Trả về null nếu LLM không phản hồi trong hạn -> caller dùng fallback.
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

// Bóc JSON ra khỏi phản hồi LLM (chịu được ```json fence và text thừa).
function extractJson(text) {
  if (!text) return null
  let cleaned = String(text).trim()
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) cleaned = fenceMatch[1].trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return null
  }
}

// Chuẩn hóa + kiểm tra hợp lệ lịch trình AI sinh ra; lỗi -> null.
function normalizeItinerary(raw, fallback, expectedDayCount) {
  if (!raw || !Array.isArray(raw.days)) return null

  const days = raw.days
    .map((day, index) => {
      const events = Array.isArray(day.events)
        ? day.events
            .filter((evt) => evt && (evt.title || evt.desc))
            .map((evt) => ({
              time: normalizeTime(evt.time) || '09:00',
              title: String(evt.title || 'Hoạt động').trim(),
              desc: String(evt.desc || '').trim(),
            }))
            .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
        : []
      return { dayNum: Number(day.dayNum) || index + 1, events }
    })
    .filter((day) => day.events.length > 0)

  if (!days.length) return null

  const title = typeof raw.title === 'string' && raw.title.trim()
    ? raw.title.trim()
    : fallback?.title

  const expected = Number(expectedDayCount) || 0
  const fallbackDays = Array.isArray(fallback?.days) ? fallback.days : []
  const normalizedDays = expected > 0 && days.length < expected
    ? Array.from({ length: expected }, (_, index) => {
        const dayNum = index + 1
        return days.find((day) => day.dayNum === dayNum)
          || fallbackDays.find((day) => day.dayNum === dayNum)
          || days[index]
      }).filter(Boolean)
    : days

  return { title, days: normalizedDays }
}

/**
 * SEAM 1 — Sinh lịch trình bằng AI.
 * @returns {{ itinerary, source: 'ai' | 'fallback' }}
 */
export async function generateItineraryWithAI({
  destinationId,
  dayCount = 3,
  party = 'Gia đình 4 người',
  interests = '',
  fallback,
}) {
  const destName = destinationNames[destinationId] || 'Vinpearl'

  // Toàn bộ pipeline (RAG + LLM) nằm trong timeout để fallback luôn kích hoạt,
  // kể cả khi fetch RAG/thời tiết treo.
  const run = (async () => {
    const ragContext = await getRAGContext(`lịch trình nghỉ dưỡng ${destName}`, destinationId)

    const systemPrompt = `Bạn là Vinpearl AI chuyên thiết kế lịch trình nghỉ dưỡng tại ${destName}.
Chỉ dùng các địa điểm/nhà hàng/trải nghiệm Vinpearl có thật trong DỮ LIỆU bên dưới.
Trả về DUY NHẤT một JSON hợp lệ, KHÔNG kèm giải thích, KHÔNG markdown, đúng schema:
{"title": "string", "days": [{"dayNum": 1, "events": [{"time": "HH:MM", "title": "string", "desc": "string"}]}]}
Yêu cầu: ${dayCount} ngày; mỗi ngày 3-4 hoạt động với khung giờ tăng dần; cân đối check-in, ăn uống, vui chơi và nghỉ ngơi cho nhóm "${party}"; ưu tiên hoạt động trong nhà vào ngày dự báo mưa.

DỮ LIỆU BỐI CẢNH (RAG):
${ragContext}`

    const userPrompt = `Thiết kế lịch trình ${dayCount} ngày tại ${destName} cho ${party}.${
      interests ? ` Sở thích: ${interests}.` : ''
    } Chỉ trả về JSON theo schema đã yêu cầu.`

    const reply = await executeLLMChat([{ role: 'user', content: userPrompt }], systemPrompt)
    return normalizeItinerary(extractJson(reply), fallback, dayCount)
  })()

  try {
    const normalized = await withTimeout(run, GENERATE_TIMEOUT_MS)
    if (normalized) return { itinerary: normalized, source: 'ai' }
  } catch (error) {
    console.warn('AI itinerary generation failed, dùng template fallback:', error)
  }

  return { itinerary: fallback, source: 'fallback' }
}

/**
 * SEAM 2 — Gợi ý AI theo từng ngày cho thẻ thời tiết ("Gợi ý từ AI").
 * @returns {string} câu gợi ý (LUÔN có giá trị nhờ fallback)
 */
export async function getDaySuggestion({ destinationId, dayNum, events = [], dayWeather, fallback }) {
  try {
    const destName = destinationNames[destinationId] || 'Vinpearl'

    const systemPrompt = `Bạn là Vinpearl AI. Đưa ra ĐÚNG MỘT câu gợi ý ngắn (tối đa 30 từ, tiếng Việt) giúp tối ưu ngày đi chơi theo thời tiết và lịch hiện có. Chỉ trả về 1 câu, không markdown, không tiền tố "Gợi ý:".`

    const userPrompt = `Điểm đến: ${destName}. Ngày ${dayNum}.
Thời tiết: ${
      dayWeather
        ? JSON.stringify({
            weather: dayWeather.weather,
            max: dayWeather.temperatureMaxC,
            min: dayWeather.temperatureMinC,
            rainProb: dayWeather.rainProb,
          })
        : 'không rõ'
    }.
Hoạt động trong ngày: ${events.map((e) => `${e.time} ${e.title}`).join('; ') || 'chưa có'}.`

    const reply = await withTimeout(
      executeLLMChat([{ role: 'user', content: userPrompt }], systemPrompt),
      SUGGEST_TIMEOUT_MS
    )

    const text = (reply || '')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) return text
  } catch (error) {
    console.warn('AI day suggestion failed, dùng fallback:', error)
  }

  return fallback
}

/**
 * SEAM 3 — Tối ưu hóa lịch trình bằng AI (text markdown gợi ý điều chỉnh).
 * Re-export để gom mọi seam lịch trình về một chỗ; gắn vào nút bất kỳ khi cần.
 */
export { getItineraryOptimizationSuggestions as optimizeItineraryWithAI }

function normalizeTime(value) {
  const match = String(value || '').trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/)
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function timeToMinutes(time = '00:00') {
  const [hours = '0', minutes = '0'] = String(time).split(':')
  return Number(hours) * 60 + Number(minutes)
}
