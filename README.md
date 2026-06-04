# VINPEARL AI TRAVEL ASSISTANT

## Trợ Lý Du Lịch Thông Minh Cá Nhân Hóa Trong Hệ Sinh Thái Vinpearl

---

# 1. Tổng Quan Đề Tài

## Tên dự án

**Vinpearl AI Travel Assistant**

## Lĩnh vực

* TravelTech
* Hospitality
* Conversational AI
* LLM + RAG

## Mô tả

Vinpearl AI Travel Assistant là một trợ lý du lịch thông minh được xây dựng dành riêng cho hệ sinh thái Vinpearl.

Khác với các chatbot thông thường chỉ trả lời câu hỏi, hệ thống đóng vai trò như một AI Travel Concierge, giúp khách hàng:

* Khám phá điểm đến
* Tư vấn resort phù hợp
* Gợi ý hoạt động trải nghiệm
* Lập lịch trình cá nhân hóa
* Trả lời các câu hỏi liên quan đến Vinpearl

Dự án lấy cảm hứng từ Layla AI nhưng tập trung hoàn toàn vào dữ liệu và dịch vụ thuộc hệ sinh thái Vinpearl.

---

# 2. Bài Toán

Khách hàng khi lên kế hoạch du lịch thường gặp các khó khăn:

* Không biết nên chọn địa điểm nào
* Không biết resort nào phù hợp
* Khó tìm kiếm thông tin dịch vụ
* Khó xây dựng lịch trình tối ưu
* Thông tin phân tán trên nhiều website

Ví dụ:

"Tôi đi cùng gia đình có 2 trẻ nhỏ, ngân sách 20 triệu, nên đi đâu?"

Thông thường khách hàng phải:

* Tìm kiếm Google
* Xem website Vinpearl
* Đọc review
* Tự xây lịch trình

Điều này mất nhiều thời gian.

---

# 3. Giải Pháp

Xây dựng một AI Travel Assistant có khả năng:

* Hiểu nhu cầu người dùng
* Đề xuất địa điểm phù hợp
* Giới thiệu các điểm đến
* Trả lời câu hỏi liên quan đến Vinpearl
* Tạo lịch trình tự động
* Hiển thị hình ảnh và thông tin trực quan

Ví dụ:

Người dùng nhập:

"Tôi muốn đi du lịch 3 ngày 2 đêm cùng gia đình."

AI sẽ:

* Phân tích nhu cầu
* Gợi ý Phú Quốc
* Đề xuất Vinpearl Resort
* Đề xuất VinWonders
* Đề xuất Safari
* Tạo lịch trình chi tiết

---

# 4. Điểm Khác Biệt So Với Chatbot Thông Thường

## Chatbot truyền thống

* Chỉ trả lời câu hỏi
* Không có khả năng tư vấn du lịch
* Không cá nhân hóa

## Vinpearl AI Travel Assistant

* Tư vấn du lịch như chuyên gia
* Tạo lịch trình
* Cá nhân hóa theo người dùng
* Hiển thị hình ảnh địa điểm
* Hiển thị resort phù hợp
* Hiểu hệ sinh thái Vinpearl

---

# 5. Các Chức Năng Chính

## 5.1 Chat Với AI

Người dùng có thể hỏi:

* Vinpearl Phú Quốc có gì?
* Resort nào phù hợp cho gia đình?
* Có hoạt động nào cho trẻ em?
* VinWonders có gì hấp dẫn?

AI trả lời dựa trên dữ liệu Vinpearl.

---

## 5.2 Khám Phá Điểm Đến (Explore)

Hiển thị:

* Phú Quốc
* Nha Trang
* Hội An
* Hạ Long

Mỗi địa điểm gồm:

* Hình ảnh
* Mô tả
* Đánh giá
* Điểm nổi bật
* Resort liên quan

---

## 5.3 Gợi Ý Điểm Đến

Ví dụ:

Người dùng:

"Muốn nghỉ dưỡng cùng gia đình"

AI gợi ý:

* Vinpearl Phú Quốc
* Vinpearl Nha Trang

---

## 5.4 Tạo Lịch Trình

AI tự động tạo:

* 2N1Đ
* 3N2Đ
* 4N3Đ

Dựa trên:

* Số người
* Ngân sách
* Sở thích
* Địa điểm

Ví dụ:

Ngày 1:

* Check-in
* Tắm biển
* Buffet

Ngày 2:

* VinWonders
* Safari

Ngày 3:

* Spa
* Check-out

---

## 5.5 Quản Lý Chuyến Đi

Người dùng có thể:

* Lưu lịch trình
* Xem lịch trình đã tạo
* Chỉnh sửa
* Chia sẻ

---

## 5.6 Hồ Sơ Người Dùng

Lưu:

* Lịch sử tìm kiếm
* Lịch sử chuyến đi
* Sở thích du lịch
* Điểm đến yêu thích

---

# 6. Nguồn Dữ Liệu

## Vinpearl

Nguồn:

https://vinpearl.com

Dữ liệu:

* Resort
* Khách sạn
* Dịch vụ
* Nhà hàng
* Tiện ích

---

## VinWonders

Nguồn:

https://vinwonders.com

Dữ liệu:

* VinWonders
* Safari
* Grand World
* Show diễn

---

## Hình Ảnh

Nguồn:

* Website Vinpearl
* Website VinWonders
* Media Library

---

# 7. Kiến Trúc Hệ Thống

## Kiến Trúc Tổng Quan

User
↓
Mobile App
↓
Backend API
↓
AI Orchestrator
↓
RAG Engine
↓
LLM
↓
Response

---

# 8. Kiến Trúc AI

User Query
↓
Embedding
↓
Vector Search
↓
Retrieve Context
↓
Prompt Builder
↓
LLM
↓
Answer

---

# 9. Kiến Trúc Dữ Liệu

## Relational Database

PostgreSQL

Lưu:

* User
* Trips
* Itinerary
* Destination
* Resort

---

## Vector Database

pgvector

Lưu:

* Embedding dữ liệu Vinpearl
* Embedding FAQ
* Embedding dịch vụ

---

# 10. Workflow Explore

Website Vinpearl
↓
Crawler
↓
Data Cleaning
↓
Metadata Extraction
↓
Database
↓
Explore Screen

---

# 11. Workflow Chatbot

Người dùng hỏi
↓
Intent Detection
↓
Retrieve dữ liệu
↓
RAG
↓
LLM
↓
Trả lời

---

# 12. Workflow Tạo Lịch Trình

User
↓
Nhập nhu cầu
↓
Phân tích
↓
Lấy dữ liệu điểm đến
↓
Lấy dữ liệu dịch vụ
↓
AI Planning
↓
Sinh lịch trình
↓
Lưu Trip

---

# 13. Công Nghệ Đề Xuất

## Frontend

* React Native
* Expo

## Backend

* FastAPI

## Database

* PostgreSQL
* pgvector

## AI

* GPT-4o
* Gemini
* Qwen

## Embedding

* BAAI/bge-small-en-v1.5
* BGE-M3
* multilingual-e5-base

## Storage

* Supabase Storage
* AWS S3

---

# 14. Giao Diện Ứng Dụng

## Trang Chủ

* Chào người dùng
* Ô chat
* Voice Input

## Explore

* Danh sách địa điểm
* Hình ảnh
* Resort nổi bật

## Chat

* Chat với AI

## Trips

* Danh sách lịch trình

## Profile

* Hồ sơ người dùng

---

# 15. Giá Trị Mang Lại

## Đối Với Khách Hàng

* Tiết kiệm thời gian
* Dễ lên kế hoạch
* Trải nghiệm cá nhân hóa

## Đối Với Vinpearl

* Tăng chuyển đổi đặt phòng
* Tăng trải nghiệm khách hàng
* Tăng tương tác trong hệ sinh thái
* Tăng khả năng upsell dịch vụ

---

# 16. MVP Hackathon

Các chức năng bắt buộc:

✅ Chat với AI

✅ Explore địa điểm

✅ Hiển thị hình ảnh

✅ Giới thiệu resort

✅ Tạo lịch trình

✅ Lưu chuyến đi

Đây là phiên bản MVP đủ mạnh để trình diễn tại Hackathon và có khả năng mở rộng thành sản phẩm thực tế trong hệ sinh thái Vinpearl.
