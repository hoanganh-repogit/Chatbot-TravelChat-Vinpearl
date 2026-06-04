# Vinpearl Journey Concierge — Nha Trang Large Mock Data

Generated for hackathon demo.

## Time window
- From: 2026-06-04
- To: 2026-07-04
- Timezone: Asia/Ho_Chi_Minh / UTC+7

## Dataset size
- `users.json`: 6 records
- `flights.json`: 343 records
- `hotels.json`: 5 records
- `rooms.json`: 13 records
- `room-inventory.json`: 403 records
- `attractions.json`: 20 records
- `tickets.json`: 9 records
- `transport.json`: 8 records
- `restaurants.json`: 13 records
- `restaurant-slots.json`: 1860 records
- `vouchers.json`: 11 records
- `live-context.json`: object records
- `queue-snapshots.json`: 3627 records
- `weather-forecast.json`: 31 records
- `transfer-schedule.json`: 2232 records
- `itinerary-templates.json`: 4 records
- `service-requests.json`: 6 records
- `bookings.json`: 3 records
- `pricing-calendar.json`: 31 records
- `business-rules.json`: object records

## Nha Trang-specific modeling
- Uses Cam Ranh airport code `CXR`.
- Models Hòn Tre island stay, cable car, speedboat, mainland harbour transfer, and weather/wind/sea-condition constraints.
- Includes VinWonders Nha Trang zones: Festive Hill, King's Garden, World Garden, Tropical Paradise, Sea World, Fairy Land.
- Includes live reflex presets for cable car delay, heavy rain, water park cancellation, overcrowded thrill rides, island fatigue, and expiring F&B voucher.

## Notes
- This is realistic synthetic mock data, not live inventory or official pricing.
- Grounding used:
  - Vinpearl/VinWonders official materials describe VinWonders Nha Trang on Hòn Tre with zones including Festive Hill, King's Garden, World Garden, Tropical Paradise, Sea World, and Fairy Land.
  - Vinpearl official materials describe Vinpearl Resort Nha Trang on Đảo Hòn Tre.
  - Vinpearl official materials describe Vinpearl Luxury Nha Trang as a villa resort on Hòn Tre with private pools and spa.
  - VinWonders booking/guide pages list park/cable-car style operating windows; operating hours may vary by date/weather.
- Prices, queue snapshots, inventory, slots, and transfer schedules are synthetic for demo decision-making.

## Recommended usage
- Put all files under `/mock/nha-trang/*.json` or `/mock/*.json`.
- Use `live-context.json` for the widget control panel.
- Use `transfer-schedule.json` + `weather-forecast.json` to demonstrate island-transfer reflex.
- Use `queue-snapshots.json` and `restaurant-slots.json` for live itinerary adjustments.
