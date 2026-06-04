import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDestinationMeta } from '../lib/destinations.js'
import { buildLiveData, createInitialTimeline } from '../lib/liveOptimization.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '../..')

function getMockDir(destinationId) {
  return path.join(ROOT_DIR, 'data-mooc', getDestinationMeta(destinationId).folder, 'mock')
}

function readJson(mockDir, fileName) {
  return JSON.parse(fs.readFileSync(path.join(mockDir, fileName), 'utf8'))
}

// MOOC data is static, but /suggest fires on every control change. Without this
// cache we re-read ~9 JSON files from disk per keystroke. Build once, reuse.
const cachedDataByDestination = new Map()

export function loadLiveMoocData(destinationId) {
  const meta = getDestinationMeta(destinationId)
  if (cachedDataByDestination.has(meta.id)) return cachedDataByDestination.get(meta.id)

  const mockDir = getMockDir(meta.id)
  const liveContext = readJson(mockDir, 'live-context.json')
  const attractions = readJson(mockDir, 'attractions.json')
  const latestQueues = readOptionalJson(mockDir, 'latest-queues.json')
  const queueSnapshots = latestQueues ? [] : readJson(mockDir, 'queue-snapshots.json')
  const vouchers = readJson(mockDir, 'vouchers.json')
  const transport = readJson(mockDir, 'transport.json')
  const restaurants = readJson(mockDir, 'restaurants.json')
  const itineraryTemplates = readJson(mockDir, 'itinerary-templates.json')
  const serviceRequests = readJson(mockDir, 'service-requests.json')
  const bookings = readJson(mockDir, 'bookings.json')

  const engineData = buildLiveData({
    destinationId: meta.id,
    destinationName: meta.name,
    attractions,
    restaurants,
    transport,
    vouchers,
    itineraryTemplates,
    latestQueues,
    queueSnapshots,
  })

  const data = {
    destinationId: meta.id,
    destinationName: meta.name,
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

  cachedDataByDestination.set(meta.id, data)
  return data
}

export function createBootstrapPayload(destinationId) {
  const data = loadLiveMoocData(destinationId)

  return {
    destinationId: data.destinationId,
    destinationName: data.destinationName,
    presets: data.liveContext.presets,
    initialTimeline: data.initialTimeline,
    latestQueues: data.latestQueues,
    vouchers: data.vouchers,
    transport: data.transport,
    restaurants: data.restaurants,
  }
}

function readOptionalJson(mockDir, fileName) {
  const fullPath = path.join(mockDir, fileName)
  if (!fs.existsSync(fullPath)) return null
  return readJson(mockDir, fileName)
}
