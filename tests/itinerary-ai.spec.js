import { expect, test } from '@playwright/test'

const fakeItinerary = {
  title: 'Phú Quốc AI - Gia đình 4 người',
  days: [
    { dayNum: 1, events: [
      { time: '09:00', title: 'AI Check-in Vinpearl', desc: 'Hoạt động do AI thiết kế.' },
      { time: '15:00', title: 'AI Safari buổi chiều', desc: 'Khám phá vườn thú.' },
    ]},
  ],
}

test('AI sinh lịch trình: loading -> nội dung AI thay template', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  // Stub các fetch RAG bên ngoài cho nhanh, ổn định
  await page.route('**/api.open-meteo.com/**', (r) => r.abort())
  await page.route('**/hotels_clean.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/weather-forecast.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  // Mock LLM completions: trả về JSON itinerary, delay nhẹ để thấy loading
  await page.route('**/chat/completions', async (route) => {
    await new Promise(r => setTimeout(r, 600))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: JSON.stringify(fakeItinerary) } }] }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Khám phá' }).click()
  await page.getByRole('button', { name: 'TÌM KIẾM PHÒNG TRỐNG' }).click()
  await page.getByRole('button', { name: /Xem chi tiết Resort/ }).first().click()
  await page.getByRole('button', { name: 'Tạo lịch trình' }).click()

  await expect(page.getByText('Vinpearl AI đang thiết kế lịch trình…')).toBeVisible()
  await expect(page.getByText('AI Check-in Vinpearl')).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('AI Safari buổi chiều')).toBeVisible()
})
