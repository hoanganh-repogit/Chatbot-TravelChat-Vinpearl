import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildLiveData, createInitialTimeline } from '../lib/liveOptimization.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '../..')
const MOCK_DIR = path.join(ROOT_DIR, 'data-mooc/phu-quoc/mock')

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(MOCK_DIR, fileName), 'utf8'))
}

// MOOC data is static, but /suggest fires on every control change. Without this
// cache we re-read ~9 JSON files from disk per keystroke. Build once, reuse.
let cachedData = null

export function loadLiveMoocData() {
  if (cachedData) return cachedData

  const liveContext = readJson('live-context.json')
  const attractions = readJson('attractions.json')
  const latestQueues = readOptionalJson('latest-queues.json')
  const queueSnapshots = latestQueues ? [] : readJson('queue-snapshots.json')
  const vouchers = readJson('vouchers.json')
  const transport = readJson('transport.json')
  const restaurants = readJson('restaurants.json')
  const itineraryTemplates = readJson('itinerary-templates.json')
  const serviceRequests = readJson('service-requests.json')
  const bookings = readJson('bookings.json')

  const engineData = buildLiveData({
    attractions,
    restaurants,
    transport,
    vouchers,
    itineraryTemplates,
    latestQueues,
    queueSnapshots,
  })

  cachedData = {
    liveContext,
    attractions,
    latestQueues: engineData.latestQueues,
    queueSnapshots,
    vouchers,
    transport,
    restaurants,
    itineraryTemplates,
    serviceRequests,
    bookings,
    engineData,
    initialTimeline: createInitialTimeline(engineData),
  }

  return cachedData
}

export function createBootstrapPayload() {
  const data = loadLiveMoocData()

  return {
    presets: data.liveContext.presets,
    initialTimeline: data.initialTimeline,
    latestQueues: data.latestQueues,
    vouchers: data.vouchers,
    transport: data.transport,
    restaurants: data.restaurants,
  }
}

function readOptionalJson(fileName) {
  const fullPath = path.join(MOCK_DIR, fileName)
  if (!fs.existsSync(fullPath)) return null
  return readJson(fileName)
}
