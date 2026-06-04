# Vinpearl Journey Concierge — Ha Long Large Mock Data

Generated for hackathon demo.

## Time window
- From: 2026-06-04
- To: 2026-07-04
- Timezone: Asia/Ho_Chi_Minh / UTC+7

## Dataset size
- `users.json`: 6 records
- `flights.json`: 206 records
- `road-transfers.json`: 248 records
- `hotels.json`: 5 records
- `rooms.json`: 13 records
- `room-inventory.json`: 403 records
- `attractions.json`: 20 records
- `tickets.json`: 9 records
- `transport.json`: 7 records
- `restaurants.json`: 13 records
- `restaurant-slots.json`: 1860 records
- `cruise-slots.json`: 155 records
- `pier-schedule.json`: 1829 records
- `vouchers.json`: 10 records
- `live-context.json`: object records
- `queue-snapshots.json`: 3844 records
- `weather-forecast.json`: 31 records
- `bay-conditions.json`: 93 records
- `itinerary-templates.json`: 5 records
- `service-requests.json`: 6 records
- `bookings.json`: 3 records
- `pricing-calendar.json`: 31 records
- `business-rules.json`: object records

## Ha Long-specific modeling
- Hạ Long is modeled differently from Phú Quốc and Nha Trang:
  - Road transfer from Hà Nội is the primary travel mode.
  - Flights are supporting options via Cát Bi `HPH` or Vân Đồn `VDO`.
  - Vinpearl Resort & Spa Hạ Long is modeled on Đảo Rều / Bãi Cháy with short resort boat transfer.
  - Live itinerary reflex focuses on bay condition, wind, rain, resort boat, road traffic, and cruise availability.
- Includes:
  - `road-transfers.json`
  - `cruise-slots.json`
  - `pier-schedule.json`
  - `bay-conditions.json`
  - `weather-forecast.json`

## Notes
- This is realistic synthetic mock data, not live inventory or official pricing.
- Grounding used:
  - Vinpearl official site places Vinpearl Resort & Spa Hạ Long on Đảo Rều, Bãi Cháy, Hạ Long, Quảng Ninh.
  - Vinpearl travel content describes the resort as roughly 155 km from Hà Nội and near Cát Bi airport.
  - Vinpearl content describes a short boat/speedboat connection between mainland and the resort island.
  - Hạ Long summer mock weather models heat, humidity, showers, wind, and bay/cruise disruption risk.
- Sun World / water park / theme park entities are modeled as nearby entertainment mock resources for demo purposes.
- Prices, queue snapshots, cruise slots, inventory, restaurant slots, and pier schedules are synthetic.

## Recommended usage
- Put all files under `/mock/ha-long/*.json`.
- Use `live-context.json` for the widget control panel.
- Use `bay-conditions.json`, `cruise-slots.json`, and `pier-schedule.json` to demonstrate weather/boat reflex.
- Use `road-transfers.json` and `pricing-calendar.json` to demonstrate Hanoi → Ha Long planning.
