export const DEFAULT_DESTINATION_ID = 'phu_quoc'

export const DESTINATIONS = {
  phu_quoc: {
    id: 'phu_quoc',
    folder: 'phu-quoc',
    name: 'Phú Quốc',
  },
  nha_trang: {
    id: 'nha_trang',
    folder: 'nha-trang',
    name: 'Nha Trang',
  },
  hoi_an: {
    id: 'hoi_an',
    folder: 'nam-hoi-an',
    name: 'Nam Hội An',
  },
  ha_long: {
    id: 'ha_long',
    folder: 'ha-long',
    name: 'Hạ Long',
  },
}

export function normalizeDestinationId(destinationId) {
  return DESTINATIONS[destinationId]?.id || DEFAULT_DESTINATION_ID
}

export function getDestinationMeta(destinationId) {
  return DESTINATIONS[normalizeDestinationId(destinationId)]
}

export function getDestinationName(destinationId) {
  return getDestinationMeta(destinationId).name
}
