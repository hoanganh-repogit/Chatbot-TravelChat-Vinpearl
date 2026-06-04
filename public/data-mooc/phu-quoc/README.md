# Vinpearl Journey Concierge — Large Mock Data

Generated for hackathon demo.

## Time window
- From: 2026-06-04
- To: 2026-07-04
- Timezone: Asia/Ho_Chi_Minh / UTC+7

## Dataset size
- `users.json`: 5 records
- `flights.json`: 261 records
- `hotels.json`: 5 records
- `rooms.json`: 13 records
- `room-inventory.json`: 403 records
- `attractions.json`: 18 records
- `tickets.json`: 9 records
- `transport.json`: 7 records
- `restaurants.json`: 12 records
- `restaurant-slots.json`: 1767 records
- `vouchers.json`: 8 records
- `live-context.json`: object records
- `queue-snapshots.json`: 2821 records
- `weather-forecast.json`: 31 records
- `itinerary-templates.json`: 3 records
- `service-requests.json`: 5 records
- `bookings.json`: 2 records
- `pricing-calendar.json`: 31 records
- `business-rules.json`: object records

## Notes
- This is realistic mock data, not live inventory or official pricing.
- Official opening-hour references used as grounding:
  - VinWonders Phú Quốc commonly listed as 09:00–19:30 daily.
  - Vinpearl Safari Phú Quốc commonly listed as 08:30–16:00 daily.
  - Grand World shows are modeled as evening events.
- Prices and inventory are synthetic, designed for demo decision-making.

## Recommended usage
- Put all files under `/mock/*.json`.
- Load directly in Next.js via static import or `/api/mock/[resource]`.
- Use `live-context.json` for the left control panel.
- Use `queue-snapshots.json`, `weather-forecast.json`, and `restaurant-slots.json` to make the live itinerary reflex feel real.
