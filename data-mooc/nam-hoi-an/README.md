# Vinpearl Journey Concierge — Nam Hoi An Large Mock Data

Generated for hackathon demo.

## Time window
- From: 2026-06-04
- To: 2026-07-04
- Timezone: Asia/Ho_Chi_Minh / UTC+7

## Dataset size
- `users.json`: 6 records
- `flights.json`: 343 records
- `ground-transfers.json`: 248 records
- `hotels.json`: 5 records
- `rooms.json`: 13 records
- `room-inventory.json`: 403 records
- `attractions.json`: 20 records
- `tickets.json`: 9 records
- `transport.json`: 7 records
- `restaurants.json`: 13 records
- `restaurant-slots.json`: 1798 records
- `park-schedule.json`: 372 records
- `vouchers.json`: 12 records
- `live-context.json`: object records
- `queue-snapshots.json`: 3751 records
- `weather-forecast.json`: 31 records
- `road-conditions.json`: 93 records
- `itinerary-templates.json`: 5 records
- `service-requests.json`: 6 records
- `bookings.json`: 3 records
- `pricing-calendar.json`: 31 records
- `business-rules.json`: object records

## Nam Hoi An-specific modeling
- Uses Da Nang airport code `DAD` as the main airport gateway.
- Models road transfer from Da Nang airport to Nam Hội An, and shuttle/taxi to Hội An Old Town.
- Models VinWonders Nam Hội An zones: Harbor Corner, Island of Folk Culture, River Safari, Adventure Land, Water World, Indoor Games.
- Adds park show schedule, River Safari status, old town traffic, heat/rain reflex, and resort/villa/golf context.

## Notes
- This is realistic synthetic mock data, not live inventory or official pricing.
- Grounding used:
  - VinWonders Nam Hội An official/guide pages describe major zones including Harbor Corner, Island of Folk Culture, River Safari, Adventure Land, Water World, and Indoor Games.
  - Vinpearl Resort & Golf Nam Hội An guidance describes transfer from Da Nang International Airport to the resort taking roughly 45–60 minutes depending on route/service.
  - Vinpearl Golf Nam Hội An is described as around 45 minutes by car from Da Nang airport and about 17 km south of Hội An Old Town.
- Prices, queue snapshots, inventory, restaurant slots, show schedules, and traffic are synthetic for demo decision-making.

## Recommended usage
- Put all files under `/mock/nam-hoi-an/*.json`.
- Use `live-context.json` for the widget control panel.
- Use `ground-transfers.json`, `road-conditions.json`, and `weather-forecast.json` to demonstrate Da Nang/Hội An transfer reflex.
- Use `park-schedule.json` and `queue-snapshots.json` for River Safari/show/water park live itinerary adjustments.
