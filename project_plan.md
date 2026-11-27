# AccMarket — Sàn giao dịch tài khoản số

## 1. Project Description
Nền tảng thương mại điện tử chuyên mua bán tài khoản số (Facebook, TikTok, Gmail, Telegram, công cụ AI như ChatGPT, Midjourney, CapCut Pro). Người mua nạp tiền vào ví, chọn gói bảo hành rồi mua; hệ thống trừ ví và giao thông tin tài khoản tự động, đồng thời cộng tiền cho đối tác bán. Toàn bộ dữ liệu xác thực và dữ liệu nghiệp vụ lưu trên Supabase.

Ba nhóm người dùng:
- **Người mua (user)**: ví tiền, nạp tiền QR + admin duyệt, mua tài khoản, xem đơn đã mua.
- **Đối tác (vendor)**: do admin cấp quyền, hiển thị ẩn danh theo mã gian hàng, đăng sản phẩm, nhập kho, cấu hình bảo hành, xem ví và tạo lệnh rút.
- **Quản trị (admin)**: quản lý đối tác (thấy thông tin thật), duyệt nạp/rút, quản lý thông báo, hộp thư chat.

## 2. Page Structure
- `/` — Trang chủ (hero, thông báo, danh mục, sản phẩm nổi bật, bảng tin giao dịch live)
- `/san-pham` — Danh sách **toàn bộ** sản phẩm đang mở bán của mọi đối tác và của sàn (cập nhật realtime), lọc theo nguồn hàng, danh mục, thương hiệu có logo, tìm kiếm
- `/san-pham/:id` — Chi tiết sản phẩm, chọn gói bảo hành, mua ngay, thẻ gian hàng đối tác
- `/dang-nhap` — Đăng nhập (Google, email/mật khẩu, tài khoản `admin`)
- `/dang-ky` — Đăng ký (chọn *Khách mua hàng* hoặc *Đối tác bán hàng*; đăng ký đối tác tự gửi yêu cầu tới admin và mở phòng chat)
- `/auth/callback` — Nhận kết quả đăng nhập Google (PKCE)
- `/auth/reset-password` — Đặt lại mật khẩu sau khi xác thực email
- `/nap-tien` — Nạp tiền theo đúng tài khoản ngân hàng do admin cài, tạo mã nạp, xem lịch sử nạp
- `/don-hang` — Đơn hàng đã mua, xem lại thông tin tài khoản
- `/vi` — Ví tiền, biến động số dư
- `/tai-khoan` — Tài khoản người mua: số dư ví, lịch sử mua hàng có tìm kiếm, xem lại tài khoản đã mua
- `/kenh-doi-tac` — Vendor dashboard: hình ảnh gian hàng, thư viện ảnh, sản phẩm (nhiều ảnh, định dạng tài khoản linh hoạt), ví & rút tiền, hộp thư khách hàng, thông báo phí trưng bày
- `/quan-tri` — Admin dashboard: hộp thư hỗ trợ 3 bên, duyệt nạp tiền + quản lý tài khoản nhận nạp, duyệt lệnh rút tiền, chỉnh banner/ảnh tài khoản live/thông tin liên hệ, cài phí trưng bày và gửi thông báo đối tác, nút đăng xuất riêng

## 3. Core Features
- [x] Xác thực Supabase Auth + bảng `profiles` 3 role
- [x] Lược đồ dữ liệu: products, product_stock, orders, deposits, withdrawals, transactions, announcements, messages, shop_media
- [x] Hàm mua hàng nguyên tử: kiểm tra số dư, trừ ví, giao acc, cộng ví đối tác
- [x] Đăng nhập Google (OAuth PKCE) + cổng đăng nhập quản trị `admin` qua Edge Function
- [x] Khoá leo thang quyền: trigger chặn tự đổi role/balance/pending_balance trên `profiles`
- [x] Trang chủ + danh sách + chi tiết sản phẩm
- [x] Vendor dashboard: đổi ảnh bìa/ảnh đại diện, thư viện ảnh không giới hạn, sửa giá, gói bảo hành, nhập kho hàng loạt
- [x] Thẻ gian hàng đối tác công khai trên trang sản phẩm (RPC `public_vendor_info`)
- [x] Khung chat realtime + tự động cuộn tin, hộp thư quản trị realtime
- [x] Chat 3 bên: admin thêm đối tác vào phòng chat của người mua (`chat_rooms`, `sender_role = vendor`)
- [x] Nhiều ảnh sản phẩm: tải ảnh từ máy lên Supabase Storage + dán liên kết, chọn ảnh bìa
- [x] Định dạng tài khoản linh hoạt theo từng sản phẩm (không cố định `user|pass|2fa|mail`)
- [x] Đối tác thêm nhiều thẻ ngân hàng và tạo lệnh rút tiền
- [x] Admin duyệt/từ chối lệnh rút tiền
- [x] Người mua xem lịch sử mua hàng, tìm kiếm theo tên sản phẩm/mã đơn/mã gian hàng
- [x] Nạp tiền QR + admin duyệt cộng ví
- [x] Cấp quyền đối tác, quản lý thông báo trong trang quản trị
- [x] Nạp tiền theo tài khoản ngân hàng admin cài (`site_settings.deposit_banks`), tạo mã nạp, admin duyệt cộng ví
- [x] Admin quản lý nhiều tài khoản nhận nạp: thêm, sửa, thay thế, bật/tắt hiển thị
- [x] Bộ lọc thương hiệu ở trang sản phẩm kèm logo và số lượng sản phẩm
- [x] Admin chỉnh banner trang chủ (chữ, ảnh, liên kết, thêm/xoá banner) và thông tin liên hệ (hotline, email, địa chỉ)
- [x] Phí trưng bày gian hàng hàng tháng: admin cài mức phí, thu theo kỳ (chống thu trùng), trừ số dư đối tác và gửi thông báo riêng cho từng đối tác
- [x] Đối tác nhận thông báo phí và thông báo hệ thống trong kênh đối tác, đánh dấu đã đọc
- [x] Tối ưu Vercel: tách tải trang theo route (lazy + Suspense), cache tài nguyên tĩnh, header bảo mật/hiệu năng
- [x] Bảng tin giao dịch live (Supabase Realtime) + dòng giao dịch tự chạy liên tục và bộ đếm giao dịch trong ngày
- [x] Ảnh bìa thương hiệu mặc định theo từng nền tảng (TikTok, Facebook, Gmail, Telegram, AI, CapCut...), tự nhận theo tên và danh mục sản phẩm; ảnh đối tác tự tải lên luôn được ưu tiên
- [x] Biểu trưng thương hiệu YAMATO SHOP (chữ Y trên nền xanh rêu viền vàng đồng) dùng thống nhất ở header, footer, trang đăng nhập
- [x] Dải ảnh tài khoản live ngay dưới banner trang chủ, admin tải/thay ảnh, đổi tiêu đề, nhãn và liên kết (`site_settings.live_showcase`)
- [x] Trang quản trị có nút đăng xuất riêng kèm tên quản trị viên đang đăng nhập
- [x] Đăng ký làm đối tác: tự gửi yêu cầu mở gian hàng vào phòng chat với admin và mở khung chat ngay sau khi đăng ký
- [x] Trang sản phẩm hiển thị đủ sản phẩm mọi đối tác, cập nhật realtime khi có sản phẩm mới, có lọc theo nguồn hàng (đối tác / sàn)
- [x] Mỗi tài khoản nhận nạp có mã QR chuyển khoản riêng và mã nội dung riêng; mã nạp sinh ra mang tiền tố của tài khoản nhận để dễ đối chiếu khi duyệt
- [x] Admin chỉnh được từ ngữ dải phân loại thương hiệu (đổi tên, ẩn/hiện từng thương hiệu, đổi tiêu đề dải lọc) — áp dụng cho dải lọc trang sản phẩm và dải nền tảng dưới banner
- [x] Nền website chuyển sang tông kem ấm dịu mắt, chữ tương phản cao dễ đọc
- [x] Bỏ khối thông tin liên hệ (hotline, email, địa chỉ) khỏi chân trang và trang quản trị

## 4. Data Model Design
### Table: profiles
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Khóa chính, tham chiếu auth.users |
| email | text | Email đăng nhập |
| full_name | text | Tên thật (chỉ admin thấy với vendor) |
| role | text | user / vendor / admin |
| balance | numeric | Số dư khả dụng |
| pending_balance | numeric | Tiền đang chờ rút |
| store_code | text | Mã gian hàng ẩn danh, ví dụ "Gian hàng #0192" |
| store_name | text | Tên hiển thị gian hàng |
| avatar_url / banner_url | text | Ảnh đại diện và ảnh bìa gian hàng |
| shop_description | text | Giới thiệu gian hàng |
| bank_name / bank_number / bank_holder | text | Thông tin nhận tiền |

### Table: shop_media
id, vendor_id, image_url, caption, sort_order, created_at — thư viện ảnh gian hàng, không giới hạn số lượng, ai cũng xem được nhưng chỉ chủ shop/admin sửa.

### Table: products
id, vendor_id, vendor_code, name, category, description, image_url (ảnh bìa), images (jsonb mảng ảnh), base_price, warranty_options (jsonb: label, days, extra_price), delivery_format (định dạng tài khoản tự do), delivery_time, stock_count, sold_count, is_active

### Table: product_stock
id, product_id, account_data (`user|pass|2fa|mail`), is_sold, order_id

### Table: orders
id, buyer_id, vendor_id, product_id, product_name, vendor_code, warranty_label, warranty_days, quantity, unit_price, total_amount, account_data, status

### Table: deposits / withdrawals
Người mua tạo lệnh nạp (amount, transfer_code, status), đối tác tạo lệnh rút (amount, bank info, status). Admin duyệt để cộng/trừ ví.

### Table: transactions
type (purchase/deposit/withdraw/sale), amount, display_name (đã che ký tự), description, product_name — dùng cho bảng tin live công khai.

### Table: announcements
audience (customer/vendor), title, content, is_active

### Table: messages
user_id, sender_role (user/admin/vendor), content, is_read

### Table: chat_rooms
user_id (PK), vendor_id (đối tác được admin thêm vào phòng), created_at, updated_at

### Table: vendor_bank_cards
id, vendor_id, bank_name, bank_number, bank_holder, is_default, created_at

### Table: site_settings
key (PK), value (jsonb), updated_at — nội dung website do admin chỉnh: `banner_slides`, `live_showcase`, `deposit_banks` (kèm `content_prefix`, `qr_image` từng tài khoản), `brand_labels` (tiêu đề + từ ngữ + thương hiệu ẩn), `display_fee`. Ai cũng đọc được, chỉ admin ghi.

### Function: create_deposit_v2
Tạo lệnh nạp cho người dùng đang đăng nhập, sinh `transfer_code` = tiền tố nội dung của tài khoản nhận + 6 ký tự ngẫu nhiên, lưu `method` = "Tên ngân hàng · Số tài khoản" để admin đối chiếu khi duyệt.

### Table: vendor_notifications
id, vendor_id, type (fee/notice/system), title, content, amount, period, is_read, created_at — thông báo phí và thông báo từ admin tới từng đối tác.

### Function: charge_display_fee
Admin-only, thu phí trưng bày theo kỳ `YYYY-MM`, trừ số dư từng đối tác đang hoạt động, tạo thông báo và chống thu trùng trong cùng kỳ.

## 5. Backend / Third-party Integration Plan
- Database & Auth: **SaaS Supabase** (đã kết nối)
- Realtime: bật cho transactions, messages, orders, announcements, products
- Thanh toán: QR chuyển khoản ngân hàng + Admin duyệt tay (không dùng cổng thanh toán)
- Shopify / Stripe: không dùng

## 6. Development Phase Plan

### Phase 1: Nền tảng, xác thực và trang chủ
- Goal: Người dùng thấy được sàn chuyên nghiệp, đăng ký/đăng nhập được
- Deliverable: Lược đồ DB + RLS, layout mới, trang chủ có bảng tin live + thông báo, trang đăng nhập/đăng ký, danh sách & chi tiết sản phẩm có chức năng mua

### Phase 2: Ví tiền và nạp tiền
- Goal: Người mua nạp tiền vào ví, xem biến động số dư và đơn đã mua
- Deliverable: Trang nạp tiền QR, trang ví, trang đơn hàng

### Phase 3: Đối tác và quản trị
- Goal: Đối tác đăng bán và rút tiền, admin duyệt tài chính và cấp quyền
- Deliverable: Vendor dashboard, Admin dashboard, quản lý thông báo

### Phase 4: Chat trực tuyến realtime
- Goal: Khách/đối tác nhắn tin 1-1 với admin ngay trên web
- Deliverable: Bong bóng chat nổi, hộp thư admin realtime

### Phase 5: Quản trị nội dung và vận hành tài chính
- Goal: Admin tự vận hành toàn bộ website mà không cần sửa code
- Deliverable: Trang nạp tiền theo tài khoản admin cài, duyệt nạp/rút, chỉnh banner và liên hệ, phí trưng bày hàng tháng có thông báo, bộ lọc thương hiệu, tối ưu triển khai Vercel

### Phase 6: Nhận diện nạp tiền và tinh chỉnh giao diện
- Goal: Người nạp tiền nhận diện đúng tài khoản nhận, admin duyệt nhanh; giao diện dịu mắt hơn
- Deliverable: Mã QR + mã nội dung riêng từng tài khoản nhận nạp, bảng duyệt hiển thị tài khoản nhận, admin chỉnh danh sách phân loại thương hiệu, nền kem ấm, bỏ khối thông tin liên hệ