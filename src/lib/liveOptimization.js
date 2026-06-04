const RAINY_WEATHER = new Set(['heavy_rain', 'thunderstorm'])
const QUEUE_HIGH_MIN = 40
const QUEUE_MEDIUM_MIN = 25
const RAIN_PROB_THRESHOLD = 60

const LOCATION_LABELS = {
  resort_lobby: 'Resort lobby',
  vinwonders_gate: 'cổng VinWonders',
  typhoon_world: 'Typhoon World',
  aquarium: 'Aquarium',
  safari: 'Safari',
  grand_world: 'Grand World',
}

// Trời được coi là có rủi ro mưa khi weather là mưa lớn/dông HOẶC rainProb đủ cao
// (khớp rule template prefer_indoor_if_rainProb_gt_60), giúp slider rainProb có tác động thật.
export function isRainRisk(ctx) {
  return RAINY_WEATHER.has(ctx.weather) || Number(ctx.rainProb || 0) >= RAIN_PROB_THRESHOLD
}

const BLOCK_TO_ENTITY = {
  typhoon_world: 'a_typhoon_world',
  roller_coaster: 'a_roller_coaster',
  aquarium: 'a_sea_shell',
  indoor_show: 'a_indoor_show',
  safari_bus: 'a_safari_bus',
  giraffe_lunch: 'rst_giraffe',
  grand_world_dinner: 'rst_almaz',
  night_show_optional: 'a_grand_world_show',
}

const DEFAULT_DAY_2_BLOCKS = [
  'typhoon_world',
  'roller_coaster',
  'giraffe_lunch',
  'aquarium',
  'safari_bus',
  'grand_world_dinner',
  'night_show_optional',
]

const DEFAULT_TIMES = ['10:00', '11:20', '12:30', '14:00', '15:30', '18:30', '20:15']

export function normalizeLiveContext(preset = {}) {
  return {
    weather: preset.weather || 'sunny',
    rainProb: Number(preset.rainProb || 0),
    temperatureC: Number(preset.temperatureC || 30),
    crowd: preset.crowd || 'medium',
    queues: { ...(preset.queues || {}) },
    energy: preset.energy || 'medium',
    childTired: Boolean(preset.childTired),
    elderlyMode: Boolean(preset.elderlyMode),
    avoidLongWalk: Boolean(preset.avoidLongWalk || preset.elderlyMode),
    location: preset.location || 'vinwonders_gate',
    voucherExpiring: preset.voucherExpiring || '',
    dinnerSlotTight: Boolean(preset.dinnerSlotTight),
  }
}

export function buildLiveData({ attractions, restaurants, transport, vouchers, itineraryTemplates, latestQueues, queueSnapshots = [] }) {
  const attractionById = Object.fromEntries(attractions.map((item) => [item.id, item]))
  const restaurantById = Object.fromEntries(restaurants.map((item) => [item.id, item]))
  const voucherById = Object.fromEntries(vouchers.map((item) => [item.id, item]))
  // Ưu tiên dùng latestQueues đã precompute (file nhỏ); fallback tính từ snapshot nếu được truyền vào.
  const resolvedLatestQueues = latestQueues || buildLatestQueues(queueSnapshots)
  const template = itineraryTemplates.find((item) => item.id === 'tpl_active_3n2d') || itineraryTemplates[0]
  const dayTwoBlocks = template?.days?.find((day) => day.day === 2)?.blocks || DEFAULT_DAY_2_BLOCKS

  return {
    attractions,
    restaurants,
    transport,
    vouchers,
    attractionById,
    restaurantById,
    voucherById,
    latestQueues: resolvedLatestQueues,
    dayTwoBlocks,
  }
}

export function createInitialTimeline(data) {
  const blockIds = [...new Set([...data.dayTwoBlocks, ...DEFAULT_DAY_2_BLOCKS])]
    .map((block) => BLOCK_TO_ENTITY[block])
    .filter(Boolean)

  const orderedIds = [
    'a_typhoon_world',
    'a_roller_coaster',
    'rst_giraffe',
    'a_sea_shell',
    'a_safari_bus',
    'rst_almaz',
    'a_grand_world_show',
  ].filter((id) => blockIds.includes(id))

  return orderedIds.map((id, index) => {
    const attraction = data.attractionById[id]
    const restaurant = data.restaurantById[id]
    const base = attraction || restaurant

    return {
      id,
      sourceId: id,
      time: DEFAULT_TIMES[index] || '16:00',
      title: base.name,
      zone: base.zone || base.park || 'Phu Quoc',
      type: attraction ? attraction.type : 'meal',
      sourceType: attraction ? 'attraction' : 'restaurant',
      indoor: attraction ? attraction.indoor : restaurant.indoor,
      outdoor: attraction ? !attraction.indoor : !restaurant.indoor,
      weatherSensitive: Boolean(attraction?.weatherSensitive),
      intensity: attraction?.intensity || 'low',
      walkLevel: attraction?.walkLevel || 'low',
      defaultQueueMin: attraction ? data.latestQueues[id] ?? attraction.defaultQueueMin : 0,
      kidFriendly: attraction?.kidFriendly ?? restaurant?.kidFriendly ?? true,
      elderlyFriendly: attraction?.elderlyFriendly ?? restaurant?.elderlyFriendly ?? true,
      acceptsVoucher: restaurant?.acceptsVoucher || [],
      mealPeriod: index >= 5 ? 'dinner' : restaurant ? 'lunch' : null,
      reason: 'Lấy từ mock itinerary + attraction/restaurant Phú Quốc',
    }
  })
}

function buildLatestQueues(queueSnapshots) {
  const latestByAttraction = new Map()

  queueSnapshots.forEach((snapshot) => {
    const current = latestByAttraction.get(snapshot.attractionId)
    const stamp = `${snapshot.date}T${snapshot.time}`
    if (!current || stamp > current.stamp) {
      latestByAttraction.set(snapshot.attractionId, { stamp, queueMin: snapshot.queueMin })
    }
  })

  return Object.fromEntries(
    [...latestByAttraction.entries()].map(([attractionId, snapshot]) => [attractionId, snapshot.queueMin])
  )
}

export function getQueueMin(item, ctx) {
  return ctx.queues?.[item.sourceId] ?? item.defaultQueueMin ?? 0
}

export function fitScore(item, ctx) {
  let score = 1

  if (isRainRisk(ctx) && item.weatherSensitive) score -= 0.6
  if (ctx.weather === 'very_hot' && item.outdoor && item.intensity === 'high') score -= 0.3

  const queue = getQueueMin(item, ctx)
  if (queue >= QUEUE_HIGH_MIN) score -= 0.4
  else if (queue >= QUEUE_MEDIUM_MIN) score -= 0.2

  if (item.sourceType === 'attraction') {
    if (ctx.crowd === 'overcrowded') score -= 0.25
    else if (ctx.crowd === 'high') score -= 0.1
  }

  if (ctx.childTired && item.intensity === 'high') score -= 0.4
  if (ctx.elderlyMode && item.walkLevel === 'high') score -= 0.5
  if (ctx.energy === 'low' && item.intensity === 'high') score -= 0.3

  return Math.max(0, Number(score.toFixed(2)))
}

export function getItemWarnings(item, ctx) {
  const warnings = []
  const queue = getQueueMin(item, ctx)
  const score = fitScore(item, ctx)

  if (isRainRisk(ctx) && item.weatherSensitive) {
    const heavy = RAINY_WEATHER.has(ctx.weather)
    warnings.push({ key: 'weather', label: heavy ? 'Mưa lớn' : 'Rủi ro mưa', tone: 'danger' })
  }
  if (queue >= QUEUE_HIGH_MIN) warnings.push({ key: 'queue', label: 'Chờ lâu', tone: 'danger' })
  else if (queue >= QUEUE_MEDIUM_MIN) warnings.push({ key: 'queue-mid', label: 'Queue tăng', tone: 'warn' })
  if (ctx.crowd === 'overcrowded' && item.sourceType === 'attraction' && item.outdoor) warnings.push({ key: 'crowd', label: 'Quá tải', tone: 'warn' })
  if (ctx.childTired && item.intensity === 'high') warnings.push({ key: 'child', label: 'Bé mệt', tone: 'warn' })
  if (ctx.elderlyMode && item.walkLevel === 'high') warnings.push({ key: 'walk', label: 'Đi bộ xa', tone: 'warn' })
  if (ctx.energy === 'low' && item.intensity === 'high') warnings.push({ key: 'energy', label: 'Nặng nhịp', tone: 'warn' })
  if (score < 0.5) warnings.push({ key: 'fit', label: `Fit ${Math.round(score * 100)}%`, tone: 'danger' })

  return warnings
}

export function buildSuggestion(timeline, ctx, data) {
  const hasRainRisk = isRainRisk(ctx) && timeline.some((item) => item.weatherSensitive)
  const highQueueItem = timeline.find((item) => getQueueMin(item, ctx) >= QUEUE_HIGH_MIN)
  const fatigue = ctx.childTired || ctx.elderlyMode || ctx.energy === 'low'
  const overcrowded = ctx.crowd === 'overcrowded'
  const voucher = ctx.voucherExpiring ? data.voucherById[ctx.voucherExpiring] : null

  if (voucher && ctx.dinnerSlotTight) {
    return `${voucher.title} đang cần dùng trong bữa tối. Giữ một slot dinner hiện có ở Grand World/Resort và gắn voucher, không tạo thêm bữa ăn.`
  }

  if (hasRainRisk && fatigue) {
    return 'Trời mưa lớn và gia đình đang xuống sức. Nên chuyển hoạt động outdoor sang indoor, chèn nghỉ 45 phút tại resort và dùng xe điện cho chặng liên khu.'
  }

  if (hasRainRisk) {
    return 'Mưa lớn làm các hoạt động outdoor kém phù hợp. Nên đổi Water Park/ride ngoài trời sang Sea Shell Aquarium, Teddy Bear Museum hoặc mini show trong nhà.'
  }

  if (highQueueItem) {
    return `${highQueueItem.title} đang chờ khoảng ${getQueueMin(highQueueItem, ctx)} phút. Nên đảo sang hoạt động queue thấp hơn rồi quay lại khi đỡ đông.`
  }

  if (overcrowded) {
    return 'Khu vui chơi đang quá tải. Nên ưu tiên Fastpass, dời các trò ngoài trời sang khung giờ vắng và chèn hoạt động indoor ít xếp hàng.'
  }

  if (fatigue) {
    return 'Nhịp hiện tại hơi nặng cho gia đình. Nên chèn Rest at resort 45’ và ưu tiên hoạt động low-walk, có điều hòa.'
  }

  return 'Lịch trình đang ổn. Giữ outdoor trước, indoor sau bữa trưa và theo dõi queue trước khi di chuyển liên khu.'
}

export function optimizeTimeline(timeline, liveContext, itemLocks = {}, data) {
  const toasts = []
  const reasons = []
  const usedIds = new Set(timeline.map((item) => item.sourceId))

  const fatigue = liveContext.childTired || liveContext.elderlyMode || liveContext.energy === 'low'

  const transformed = timeline.map((item) => {
    if (itemLocks[item.id]) return item

    const queue = getQueueMin(item, liveContext)
    const score = fitScore(item, liveContext)

    const needsRainSwap = isRainRisk(liveContext) && item.weatherSensitive
    const needsQueueSwap = queue >= QUEUE_HIGH_MIN
    const needsCrowdSwap = liveContext.crowd === 'overcrowded' && item.outdoor && (item.intensity === 'high' || item.intensity === 'medium')
    const needsFatigueSwap = fatigue && item.intensity === 'high' && score < 0.5
    const needsHeatSwap = liveContext.weather === 'very_hot' && item.outdoor && item.intensity === 'high' && score < 0.5

    if (needsRainSwap || needsQueueSwap || needsCrowdSwap || needsFatigueSwap || needsHeatSwap) {
      const alternative = findAlternative(item, liveContext, data, usedIds)
      if (alternative) {
        usedIds.add(alternative.id)
        const reason = needsRainSwap
          ? `${item.title} nhạy thời tiết, đổi sang ${alternative.name} trong nhà.`
          : needsQueueSwap
            ? `${item.title} queue ${queue} phút, đổi sang ${alternative.name} queue thấp hơn.`
            : needsCrowdSwap
              ? `${item.title} đang quá tải, đổi sang ${alternative.name} ít đông hơn.`
              : `${item.title} quá nặng cho gia đình đang mệt, đổi sang ${alternative.name} nhẹ nhàng hơn.`

        reasons.push(reason)
        toasts.push(`✓ ${reason}`)

        return attractionToTimelineItem(alternative, item.time, reason)
      }
    }

    return item
  })

  let nextTimeline = transformed

  if (fatigue) {
    const restItem = createRestItem()
    if (!nextTimeline.some((item) => item.id === restItem.id)) {
      const insertAfter = Math.max(1, nextTimeline.findIndex((item) => item.mealPeriod === 'lunch'))
      const withRest = [
        ...nextTimeline.slice(0, insertAfter + 1),
        restItem,
        ...nextTimeline.slice(insertAfter + 1),
      ]
      nextTimeline = reconcileLockedPositions(timeline, withRest, itemLocks)
      reasons.push('Gia đình mệt/elderly mode, chèn Rest at resort 45’ trước khi tiếp tục.')
      toasts.push('✓ Đã chèn Rest at resort 45’')
    }
  }

  if (liveContext.elderlyMode || liveContext.avoidLongWalk) {
    const greenSm = data.transport.find((item) => item.id === 'tr_greensm_7')
    if (greenSm) {
      const pickup = LOCATION_LABELS[liveContext.location] || 'điểm hiện tại'
      reasons.push(`${greenSm.type} phù hợp elderly/avoid long walk, đón tại ${pickup}, ETA ${greenSm.etaMin} phút.`)
      toasts.push(`✓ ${greenSm.type} đón tại ${pickup} sau ${greenSm.etaMin} phút`)
    }
  }

  if (liveContext.voucherExpiring && liveContext.dinnerSlotTight) {
    const voucher = data.voucherById[liveContext.voucherExpiring]
    const dinnerIndex = nextTimeline.findIndex((item) => {
      if (item.mealPeriod !== 'dinner') return false
      const zoneOk = voucher?.applicableZones?.some((zone) => item.zone.includes(zone))
      return item.acceptsVoucher?.includes(voucher.id) || zoneOk
    })

    if (voucher && dinnerIndex >= 0 && !itemLocks[nextTimeline[dinnerIndex].id]) {
      nextTimeline = nextTimeline.map((item, index) => (
        index === dinnerIndex
          ? { ...item, voucherId: voucher.id, voucherTitle: voucher.title, reason: `Gắn ${voucher.title} vào dinner gần nhất.` }
          : item
      ))
      reasons.push(`Gắn ${voucher.title} vào ${nextTimeline[dinnerIndex].title}; không tạo bữa ăn mới.`)
      toasts.push(`✓ Đã gắn voucher F&B vào ${nextTimeline[dinnerIndex].title}`)
    }
  }

  if (!toasts.length) {
    reasons.push('Lịch trình hiện đã hợp lý với điều kiện thực tế — không cần đổi hoạt động.')
    toasts.push('✓ Đã kiểm tra: lịch trình đang tối ưu, không có xung đột.')
  }

  return {
    timeline: nextTimeline,
    suggestion: buildSuggestion(nextTimeline, liveContext, data),
    toasts,
    reasons,
  }
}

function findAlternative(item, ctx, data, usedIds) {
  const candidates = data.attractions
    .filter((candidate) => candidate.id !== item.sourceId)
    .filter((candidate) => !usedIds.has(candidate.id))
    .filter((candidate) => {
      if (isRainRisk(ctx)) return candidate.indoor && !candidate.weatherSensitive
      if (ctx.elderlyMode || ctx.childTired || ctx.energy === 'low') return candidate.walkLevel === 'low' && candidate.intensity === 'low'
      if (ctx.weather === 'very_hot') return candidate.indoor || candidate.intensity !== 'high'
      return true
    })
    .map((candidate) => ({
      candidate,
      score: fitScore(attractionToTimelineItem(candidate, item.time), ctx),
      queue: ctx.queues?.[candidate.id] ?? candidate.defaultQueueMin,
    }))
    .filter((entry) => entry.score >= 0.55 && entry.queue < QUEUE_HIGH_MIN)
    // Ưu tiên hoạt động phù hợp trẻ em (gia đình) trước, rồi tới fit cao, queue thấp.
    // Dùng preference thay vì loại cứng để vẫn còn phương án dự phòng khi cạn lựa chọn.
    .sort((a, b) => {
      const aKid = a.candidate.kidFriendly === false ? 1 : 0
      const bKid = b.candidate.kidFriendly === false ? 1 : 0
      if (aKid !== bKid) return aKid - bKid
      return b.score - a.score || a.queue - b.queue
    })

  return candidates[0]?.candidate || null
}

function attractionToTimelineItem(attraction, time, reason = 'Tối ưu từ mock attractions') {
  return {
    id: `${attraction.id}_${time.replace(':', '')}`,
    sourceId: attraction.id,
    time,
    title: attraction.name,
    zone: attraction.zone,
    type: attraction.type,
    sourceType: 'attraction',
    indoor: attraction.indoor,
    outdoor: !attraction.indoor,
    weatherSensitive: Boolean(attraction.weatherSensitive),
    intensity: attraction.intensity,
    walkLevel: attraction.walkLevel,
    defaultQueueMin: attraction.defaultQueueMin,
    kidFriendly: attraction.kidFriendly,
    elderlyFriendly: attraction.elderlyFriendly,
    reason,
  }
}

function createRestItem() {
  return {
    id: 'rest_resort_45',
    sourceId: 'rest_resort_45',
    time: '13:20',
    title: 'Rest at resort 45’',
    zone: 'Resort',
    type: 'rest',
    sourceType: 'system',
    indoor: true,
    outdoor: false,
    weatherSensitive: false,
    intensity: 'low',
    walkLevel: 'low',
    defaultQueueMin: 0,
    kidFriendly: true,
    elderlyFriendly: true,
    reason: 'Chèn deterministic khi childTired/elderly/energy low.',
  }
}

function reconcileLockedPositions(originalTimeline, candidateTimeline, itemLocks) {
  const lockedByIndex = new Map()
  const lockedIds = new Set()

  originalTimeline.forEach((item, index) => {
    if (itemLocks[item.id]) {
      lockedByIndex.set(index, item)
      lockedIds.add(item.id)
    }
  })

  if (!lockedByIndex.size) return candidateTimeline

  const fillItems = candidateTimeline.filter((item) => !lockedIds.has(item.id))
  const length = Math.max(candidateTimeline.length, originalTimeline.length)
  const output = []
  let fillIndex = 0

  for (let index = 0; index < length; index += 1) {
    if (lockedByIndex.has(index)) output.push(lockedByIndex.get(index))
    else if (fillIndex < fillItems.length) output.push(fillItems[fillIndex++])
  }

  return [...output, ...fillItems.slice(fillIndex)]
}
