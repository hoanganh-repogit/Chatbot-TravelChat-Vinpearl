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

const fakeChatPlanItinerary = {
  title: 'Plan từ Chat - Phú Quốc',
  days: [
    { dayNum: 1, events: [
      { time: '09:30', title: 'Chat Plan Check-in', desc: 'Hoạt động được chuyển trực tiếp từ plan trong chat.' },
      { time: '15:30', title: 'Chat Plan Safari', desc: 'Plan chat giữ nguyên khi sang Lịch trình.' },
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
  await page.route('**/api/chat/completions', async (route) => {
    await new Promise(r => setTimeout(r, 600))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: JSON.stringify(fakeItinerary) }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Khám phá', exact: true }).click()
  await page.getByRole('button', { name: /Phú Quốc.*Nghỉ dưỡng/s }).first().click()
  await page.getByRole('button', { name: 'Tạo lịch trình' }).click()

  await expect(page.getByText('Vinpearl AI đang thiết kế lịch trình…')).toBeVisible()
  await expect(page.getByText('AI Check-in Vinpearl')).toBeVisible({ timeout: 8000 })
  await expect(page.getByText('AI Safari buổi chiều')).toBeVisible()
})

test('chat plan can generate itinerary and edit draft via chat', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.route('**/api.open-meteo.com/**', (r) => r.abort())
  await page.route('**/hotels_clean.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/weather-forecast.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/api/chat/completions', async (route) => {
    const body = route.request().postDataJSON()
    const systemPrompt = body.messages?.[0]?.content || ''
    const lastMessage = body.messages?.at(-1)?.content || ''

    let content = 'Gợi ý từ AI ổn định cho lịch trình demo.'
    if (systemPrompt.includes('DUY NHẤT một JSON hợp lệ')) {
      content = JSON.stringify(fakeItinerary)
    } else if (lastMessage.includes('Thêm cafe nghỉ')) {
      content = 'Em đã thêm điểm nghỉ giữa ngày vào lịch trình.\n[TOOL_CALL: add_activity, {"day": 1, "time": "12:45", "title": "Cafe nghỉ giữa ngày", "desc": "Nghỉ nhẹ và uống nước trước khi tiếp tục lịch trình."}]'
    } else if (lastMessage.includes('Lên lịch trình')) {
      content = `Em đề xuất Phú Quốc cho gia đình 4 người với lịch trình nghỉ dưỡng, VinWonders và Safari.\n[ITINERARY_PLAN_JSON]${JSON.stringify(fakeChatPlanItinerary)}[/ITINERARY_PLAN_JSON]`
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Lịch trình 3N2Đ' }).click()

  await expect(page.getByText('Em đề xuất Phú Quốc')).toBeVisible()
  await page.getByRole('button', { name: 'Tạo lịch trình' }).click()

  await expect(page.getByText('Chat Plan Check-in')).toBeVisible()
  await expect(page.getByText('Chat Plan Safari')).toBeVisible()
  await expect(page.getByText('AI Check-in Vinpearl')).toHaveCount(0)

  await page.getByRole('button', { name: 'Chat để thay đổi lịch trình' }).click()
  await page.getByPlaceholder('Hỏi thời tiết, vé bay, khách sạn, vui chơi...').fill('Thêm cafe nghỉ giữa ngày lúc 12:45')
  await page.getByRole('button', { name: 'Gửi' }).click()

  await expect(page.getByText('Em đã thêm điểm nghỉ giữa ngày vào lịch trình.')).toBeVisible()
  await page.getByRole('button', { name: 'Hành trình', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Cafe nghỉ giữa ngày' })).toHaveCount(1)

  await page.getByRole('button', { name: 'Chốt lịch trình' }).click()
  await page.getByRole('button', { name: 'Bắt đầu Live' }).click()
  await expect(page.getByText('Live Reflex')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Chat Plan Check-in' })).toBeVisible()
})

test('visible prose itinerary from chat is preserved when creating itinerary', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.route('**/api.open-meteo.com/**', (r) => r.abort())
  await page.route('**/hotels_clean.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/weather-forecast.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/api/chat/completions', async (route) => {
    const body = route.request().postDataJSON()
    const systemPrompt = body.systemPrompt || ''
    const lastMessage = body.messages?.at(-1)?.content || ''

    let content = 'Gợi ý từ AI ổn định cho lịch trình demo.'
    if (systemPrompt.includes('DUY NHẤT một JSON hợp lệ')) {
      content = JSON.stringify(fakeItinerary)
    } else if (lastMessage.includes('Lên lịch trình prose')) {
      content = [
        'Em đề xuất lịch trình Phú Quốc 2 ngày 1 đêm như sau:',
        '',
        'Ngày 1:',
        '- 09:30 - Prose Check-in Vinpearl: Nhận phòng và nghỉ nhẹ.',
        '- 15:30 - Prose Safari chiều: Tham quan Safari theo lịch đã tư vấn.',
        '',
        'Ngày 2:',
        '- 09:00 - Prose VinWonders: Vui chơi khu indoor trước.',
        '- 11:00 - Prose Check-out: Trả phòng và kết thúc chuyến đi.',
      ].join('\n')
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content }),
    })
  })

  await page.goto('/')
  await page.getByPlaceholder('Nhập câu hỏi của bạn...').fill('Lên lịch trình prose Phú Quốc cho gia đình')
  await page.getByRole('button', { name: 'Gửi' }).click()
  await expect(page.getByText('Prose Check-in Vinpearl')).toBeVisible()

  await page.getByRole('button', { name: 'Tạo lịch trình' }).click()

  await expect(page.getByText('Prose Check-in Vinpearl')).toBeVisible()
  await expect(page.getByText('Prose Safari chiều')).toBeVisible()
  await expect(page.getByText('AI Check-in Vinpearl')).toHaveCount(0)
})

test('chat plan resets stale active day before editing a shorter itinerary', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.route('**/api.open-meteo.com/**', (r) => r.abort())
  await page.route('**/hotels_clean.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/weather-forecast.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/api/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: `Em đề xuất lịch 1 ngày để demo.\n[ITINERARY_PLAN_JSON]${JSON.stringify(fakeChatPlanItinerary)}[/ITINERARY_PLAN_JSON]`,
      }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Hành trình', exact: true }).click()
  await page.getByRole('button', { name: 'Ngày 3' }).click()
  await page.getByRole('button', { name: 'AI', exact: true }).click()
  await page.getByRole('button', { name: 'Lịch trình 3N2Đ' }).click()
  await page.getByRole('button', { name: 'Tạo lịch trình' }).click()

  await expect(page.getByText('Lịch ngày 1')).toBeVisible()
  await expect(page.getByText('Lịch ngày 3')).toHaveCount(0)

  await page.getByRole('button', { name: 'Thêm hoạt động' }).click()
  await page.getByPlaceholder('Tên hoạt động').fill('Hoạt động sau reset ngày')
  await page.getByPlaceholder('Mô tả chi tiết').fill('Hoạt động này phải lưu vào ngày đang hiển thị.')
  await page.locator('.edit-time-input').fill('17:00')
  await page.getByRole('button', { name: 'Lưu' }).click()

  await expect(page.getByText('Hoạt động sau reset ngày')).toBeVisible()
})

test('chatting about another destination after confirmation does not relabel the locked itinerary', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
  await page.route('**/api.open-meteo.com/**', (r) => r.abort())
  await page.route('**/hotels_clean.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/weather-forecast.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await page.route('**/api/chat/completions', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ content: 'Nha Trang phù hợp nếu bạn muốn nghỉ dưỡng biển đảo và vui chơi VinWonders.' }),
  }))

  await page.goto('/')
  await page.getByRole('button', { name: 'Hành trình', exact: true }).click()
  await page.getByRole('button', { name: 'Chốt lịch trình' }).click()
  await expect(page.locator('.itinerary-subtitle')).toContainText('Phú Quốc')

  await page.getByRole('button', { name: 'AI', exact: true }).click()
  await page.getByPlaceholder('Nhập câu hỏi của bạn...').fill('Nha Trang có gì cho gia đình?')
  await page.getByRole('button', { name: 'Gửi' }).click()
  await expect(page.getByText('Nha Trang phù hợp')).toBeVisible()

  await page.getByRole('button', { name: 'Hành trình', exact: true }).click()
  await expect(page.locator('.itinerary-subtitle')).toContainText('Phú Quốc')
  await expect(page.locator('.itinerary-subtitle')).not.toContainText('Nha Trang')
})
