import {
  buildSuggestion,
  fitScore,
  getItemWarnings,
  getQueueMin,
  optimizeTimeline,
} from '../lib/liveOptimization.js'
import { createBootstrapPayload, loadLiveMoocData } from './liveData.js'
import { explainOptimization } from './llmGateway.js'

export async function handleLiveApi({ method, pathname, body }) {
  if (method === 'GET' && pathname === '/api/live/bootstrap') {
    return jsonResponse(createBootstrapPayload())
  }

  if (method === 'POST' && pathname === '/api/live/suggest') {
    const { timeline, liveContext } = body || {}
    assertLivePayload(timeline, liveContext)

    // /suggest fires on every control change, so it must be instant and free:
    // deterministic warnings + headline suggestion only. The LLM is reserved
    // for the explicit /optimize action where a spinner covers the latency.
    const data = loadLiveMoocData()
    const warningsByItem = buildWarningsByItem(timeline, liveContext)
    const suggestion = buildSuggestion(timeline, liveContext, data.engineData)

    return jsonResponse({ suggestion, warningsByItem })
  }

  if (method === 'POST' && pathname === '/api/live/optimize') {
    const { timeline, liveContext, itemLocks = {} } = body || {}
    assertLivePayload(timeline, liveContext)

    const data = loadLiveMoocData()
    const result = optimizeTimeline(timeline, liveContext, itemLocks, data.engineData)
    const explanation = await explainOptimization({
      suggestion: result.suggestion,
      reasons: result.reasons,
      toasts: result.toasts,
    })

    return jsonResponse({
      timeline: result.timeline,
      suggestion: result.suggestion,
      explanation: explanation.text,
      reasons: result.reasons,
      toasts: result.toasts,
      provider: explanation.provider,
    })
  }

  if (method === 'POST' && pathname === '/api/live/action') {
    const { action, params = {} } = body || {}
    if (!action) return jsonResponse({ error: 'Missing action' }, 400)
    return jsonResponse(executeMockAction(action, params))
  }

  return jsonResponse({ error: 'Not found' }, 404)
}

function buildWarningsByItem(timeline, liveContext) {
  return Object.fromEntries(
    timeline.map((item) => [
      item.id,
      {
        fitScore: fitScore(item, liveContext),
        queueMin: getQueueMin(item, liveContext),
        warnings: getItemWarnings(item, liveContext),
      },
    ])
  )
}

function executeMockAction(action, params) {
  const data = loadLiveMoocData()

  if (action === 'call_green_sm') {
    const transport = data.transport.find((item) => item.id === (params.transportId || 'tr_greensm_7'))
      || data.transport.find((item) => item.elderlyFriendly && item.acAndStepFree)
    const confirmation = findConfirmation(data, 'transport', transport?.id)
      || makeConfirmation('transport', transport?.id, `${transport?.type || 'Green SM'} đang đến điểm đón`)

    return {
      success: true,
      confirmation,
      toast: `✓ ${transport.type} xác nhận, ETA ${transport.etaMin} phút`,
      data: transport,
    }
  }

  if (action === 'reserve_restaurant') {
    const restaurant = data.restaurants.find((item) => item.id === params.restaurantId)
      || data.restaurants.find((item) => item.id === 'rst_almaz')
    const slot = params.slot || restaurant.slots?.find((item) => item >= '18:00') || restaurant.slots?.[0]
    const confirmation = findConfirmation(data, 'restaurant_booking', restaurant.id)
      || makeConfirmation('restaurant_booking', restaurant.id, `Đã giữ bàn ${restaurant.name} lúc ${slot}`)

    return {
      success: true,
      confirmation: { ...confirmation, slot },
      toast: `✓ Đã giữ bàn ${restaurant.name} lúc ${slot}`,
      data: restaurant,
    }
  }

  if (action === 'apply_voucher') {
    const voucher = data.vouchers.find((item) => item.id === params.voucherId)
    if (!voucher) {
      return {
        success: false,
        confirmation: null,
        toast: 'Không tìm thấy voucher phù hợp',
        data: null,
      }
    }

    const targetId = params.targetId || params.restaurantId || 'rst_almaz'
    return {
      success: true,
      confirmation: makeConfirmation('voucher', targetId, `Đã áp dụng ${voucher.title}`),
      toast: `✓ Đã áp dụng ${voucher.title}`,
      data: { voucher, targetId },
    }
  }

  if (action === 'reserve_spa') {
    const confirmation = findConfirmation(data, 'spa', params.spaId || 'a_spa_akoya')
      || makeConfirmation('spa', params.spaId || 'a_spa_akoya', 'Đã giữ Akoya Spa session')

    return {
      success: true,
      confirmation,
      toast: '✓ Đã giữ Akoya Spa session',
      data: data.attractions.find((item) => item.id === (params.spaId || 'a_spa_akoya')) || null,
    }
  }

  return {
    success: false,
    confirmation: null,
    toast: `Action không được hỗ trợ: ${action}`,
    data: null,
  }
}

function findConfirmation(data, type, linkedEntityId) {
  return data.serviceRequests.find((request) => (
    request.type === type
    && request.status === 'confirmed'
    && (!linkedEntityId || request.linkedEntityId === linkedEntityId)
  )) || null
}

function makeConfirmation(type, linkedEntityId, detail) {
  return {
    id: `mock_${type}_${linkedEntityId || 'live'}_${Date.now().toString(36)}`,
    status: 'confirmed',
    type,
    linkedEntityId,
    detail,
    source: 'deterministic_mock',
  }
}

function assertLivePayload(timeline, liveContext) {
  if (!Array.isArray(timeline)) {
    const error = new Error('timeline must be an array')
    error.statusCode = 400
    throw error
  }
  if (!liveContext || typeof liveContext !== 'object') {
    const error = new Error('liveContext must be an object')
    error.statusCode = 400
    throw error
  }
}

function jsonResponse(payload, status = 200) {
  return {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  }
}
