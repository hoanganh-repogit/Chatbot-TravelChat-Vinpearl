import { getDestinationMeta } from '../lib/destinations'

const moocModules = import.meta.glob('../../data-mooc/*/mock/*.json', {
  eager: true,
  import: 'default',
})

export function loadLiveMoocClientData(destinationId) {
  const meta = getDestinationMeta(destinationId)
  const read = (fileName, { optional = false } = {}) => {
    const key = `../../data-mooc/${meta.folder}/mock/${fileName}`
    const fallbackKey = `../../data-mooc/phu-quoc/mock/${fileName}`
    const value = moocModules[key] ?? (optional ? null : moocModules[fallbackKey])

    if (!value && !optional) {
      throw new Error(`Missing live MOOC fixture: ${key}`)
    }

    return value || null
  }

  return {
    destinationId: meta.id,
    destinationName: meta.name,
    liveContext: read('live-context.json'),
    attractions: read('attractions.json'),
    latestQueues: read('latest-queues.json', { optional: true }),
    queueSnapshots: read('queue-snapshots.json', { optional: true }) || [],
    vouchers: read('vouchers.json'),
    transport: read('transport.json'),
    restaurants: read('restaurants.json'),
    itineraryTemplates: read('itinerary-templates.json'),
  }
}
