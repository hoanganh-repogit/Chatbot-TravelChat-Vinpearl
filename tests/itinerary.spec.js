import { expect, test } from '@playwright/test'

test('itinerary draft can be edited, confirmed, and started live', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.route('**/api/chat/completions', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: 'Lịch trình đang ổn. Giữ outdoor trước, indoor sau bữa trưa và theo dõi queue trước khi di chuyển liên khu.' }),
  }))
  await page.goto('/')

  await page.getByRole('button', { name: 'Hành trình', exact: true }).click()

  await expect(page.getByText('Đang chỉnh')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ngày 1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ngày 2' })).toBeVisible()
  await expect(page.getByText('Gợi ý từ AI:')).toBeVisible()
  await expect(page.locator('.weather-hour-slot')).toHaveCount(6)
  await page.getByRole('button', { name: 'Ẩn dự báo giờ' }).click()
  await expect(page.locator('.weather-hour-slot')).toHaveCount(0)
  await page.getByRole('button', { name: 'Dự báo giờ' }).click()
  await expect(page.locator('.weather-hour-slot')).toHaveCount(6)
  await expect(page.getByRole('button', { name: 'Chat để thay đổi lịch trình' })).toBeVisible()

  const firstDayTabText = await page.getByRole('button', { name: 'Ngày 1' }).innerText()
  expect(firstDayTabText).toBe('Ngày 1')

  await page.getByRole('button', { name: 'Thêm hoạt động' }).click()
  await expect(page.getByPlaceholder('Tên hoạt động')).toBeVisible()
  await page.getByPlaceholder('Tên hoạt động').fill('Cafe nghỉ giữa ngày')
  await page.getByPlaceholder('Mô tả chi tiết').fill('Nghỉ nhẹ và uống nước trước khi tiếp tục lịch trình.')
  await page.locator('.edit-time-input').fill('12:45')
  await page.getByRole('button', { name: 'Lưu' }).click()

  await expect(page.getByText('Cafe nghỉ giữa ngày')).toBeVisible()
  await expect(page.locator('.timeline-card-index')).toHaveCount(4)

  await page.getByRole('button', { name: 'Chat để thay đổi lịch trình' }).click()
  await expect(page.getByText('VINPEARL AI', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Hành trình', exact: true }).click()
  await page.getByRole('button', { name: 'Chốt lịch trình' }).click()

  await expect(page.getByText('Đã chốt')).toBeVisible()
  await expect(page.getByText('Lịch trình đã được chốt.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Thêm hoạt động' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Mở lại chỉnh sửa' })).toBeVisible()

  await page.getByRole('button', { name: 'Bắt đầu Live' }).click()
  await expect(page.getByText('Live Reflex')).toBeVisible()
  await expect(page.locator('.live-timeline').getByRole('heading', { name: 'Cafe nghỉ giữa ngày' })).toBeVisible()

  // NOW indicator: shows which time window we are currently in
  const liveNowCard = page.locator('.live-now-card')
  await expect(liveNowCard).toBeVisible()
  await expect(liveNowCard.getByText('Bây giờ')).toBeVisible()

  await page.getByLabel('Giờ demo').fill('12:50')
  await expect(liveNowCard.getByText('12:50')).toBeVisible()
  await expect(liveNowCard.getByRole('heading', { name: 'Cafe nghỉ giữa ngày' })).toBeVisible()

  await page.getByLabel('Ngày demo').selectOption('2')
  await expect(page.locator('.live-subtitle')).toContainText('Ngày 2')
  await expect(page.locator('.live-timeline').getByRole('heading', { name: 'VinWonders Phú Quốc' })).toBeVisible()

  // Transport segments between stops, each with a "Gọi xe" call button
  await expect(page.locator('.live-transit').first()).toBeVisible()
  await page.getByRole('button', { name: 'Gọi xe' }).first().click()
  await expect(page.locator('.live-toast')).toBeVisible()
})

test('live starts from the currently selected itinerary day', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.route('**/api/chat/completions', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: 'Lịch trình đang ổn.' }),
  }))
  await page.goto('/')

  await page.getByRole('button', { name: 'Hành trình', exact: true }).click()
  await page.getByRole('button', { name: 'Ngày 2' }).click()
  await page.getByRole('button', { name: 'Chốt lịch trình' }).click()
  await page.getByRole('button', { name: 'Bắt đầu Live' }).click()

  await expect(page.getByText('Live Reflex')).toBeVisible()
  await expect(page.locator('.live-subtitle')).toContainText('Ngày 2')
  await expect(page.getByRole('heading', { name: 'VinWonders Phú Quốc' })).toBeVisible()
})
