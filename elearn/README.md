# LearnHub — Online Learning Platform Interface

Đồ án mẫu cho **Topic 7 – Online Learning Platform Interface** (môn Front-end Web Development).
Công nghệ: **HTML5 · CSS3 · JavaScript ES6+ (ES Modules)**. Không dùng framework, không cần thư viện ngoài, không cần backend.

## 1. Cách chạy
Trình duyệt chặn `fetch()` với trang mở bằng `file://`, nên cần mở qua web server tĩnh (bất kỳ cách nào dưới đây):

```bash
cd elearn
python -m http.server 8080        # rồi mở http://localhost:8080
# hoặc: npx serve .   |   hoặc: VS Code → Live Server
```

**Tài khoản demo** (mật khẩu `123456`): `learner@demo.com` · `instructor@demo.com` · `admin@demo.com`

## 2. Đối chiếu yêu cầu đề bài

| Yêu cầu cơ bản | Thực hiện |
|---|---|
| Danh mục khóa học: card, tìm kiếm, lọc loại/cấp độ, sắp xếp, phân trang | `index.html` + `js/catalog.js` |
| Trang chi tiết: mô tả, giáo trình thu gọn, giảng viên, nút ghi danh | `course.html` + `js/course.js` |
| Trang bài học: nội dung, danh sách bài, Trước/Sau | `lesson.html` + `js/lesson.js` |
| Đánh dấu hoàn thành, thanh tiến độ, lưu `localStorage` | `js/store.js` (`toggleLesson`, `percent`) |
| Quiz trắc nghiệm, kiểm tra hợp lệ, điểm ngay | `quiz.html` + `js/quiz.js` |
| Dashboard: khóa đã ghi danh, tiến độ chung | `dashboard.html` + `js/dashboard.js` |
| Đăng nhập giả lập, responsive | `login.html`, `css/style.css` (Grid/Flexbox, media queries) |

| Yêu cầu nâng cao | Thực hiện |
|---|---|
| Học tiếp từ bài gần nhất + ghi chú theo bài | nút *Resume*, ô **My notes** (tự lưu) |
| Quiz có đồng hồ, xáo câu hỏi/đáp án, xem lại đúng/sai | `js/quiz.js` |
| Biểu đồ hoạt động 7 ngày, chuỗi ngày học, huy hiệu | `<canvas>` tự vẽ + `streak()` + 5 badge |
| Đánh giá và nhận xét khóa học | `course.js` (form có validate) |
| Màn hình giảng viên: CRUD khóa học và bài học (mock/localStorage) | `instructor.html` + `js/instructor.js` |
| Dark mode, chỉnh cỡ chữ, điều khiển bằng bàn phím | CSS variables, nút A−/A+, ARIA, focus rõ ràng |
| Chứng chỉ in/tải PDF | `certificate.html` + `@media print` |

**Phân quyền giao diện (giả lập):** Guest (xem + học thử bài 1) → Learner (ghi danh, học, quiz, đánh giá) → Instructor/Admin (trang *Instructor*).
Điều kiện nhận chứng chỉ: hoàn thành **100% bài học** và **qua quiz ≥ 60%**.

## 2b. Thiết kế giao diện
Phong cách **"bản vẽ kỹ thuật"** tham khảo từ trang fituef.online (Khoa CNTT UEF): nền giấy kẻ ô, mực navy, màu nhấn đỏ, bóng cứng lệch, nhãn đơn cách (mono). Chỉ lấy ngôn ngữ thiết kế, không dùng logo hay nội dung của trang đó.
- **Màu**: nền trắng/`#eef2f7`, chữ navy `#0d2347`, nhấn đỏ `#d71920`, dải navy `#0a3470`; có chế độ tối (`#0b1627`).
- **Font** (Google Fonts, có font dự phòng khi offline): Source Serif 4 cho tiêu đề, Be Vietnam Pro cho nội dung, JetBrains Mono cho nhãn/mã (`// 01`, chip, tiêu đề bảng).
- **Thành phần**: thẻ viền navy 1.6px, bo 4px, bóng cứng 3–6px không nhòe; nút có bóng cứng và hiệu ứng "nhấn xuống"; ô mã có 3 chấm kiểu cửa sổ; đề mục đánh số tự động bằng CSS counter.
- **Danh mục**: facet Category / Level / Duration, sắp xếp, phân trang. **Trang khóa học**: dải navy, điều hướng nội trang, mục tiêu, giáo trình, giảng viên, phân bố sao. **Dashboard**: thanh số liệu, "Continue learning", bảng khóa học, biểu đồ 7 ngày, thành tích.
- Chứng chỉ in viền đôi, chữ serif.

## 2c. Khóa học Tin học cơ bản và Tin học văn phòng (tiếng Việt)
Bốn khóa mới, tổng cộng 33 bài học, 69 bài tập có lời giải chi tiết và 170 câu trắc nghiệm có giải thích:

| Khóa | Bài | Trắc nghiệm | Nội dung chính |
|---|---|---|---|
| Tin học cơ bản | 6 | 40 | Phần cứng/phần mềm, đơn vị thông tin, nhị phân, Windows và tệp, Internet, email, tìm kiếm, an toàn thông tin, đám mây |
| Microsoft Word | 9 | 42 | Định dạng, Tab, danh sách, bảng, hình, Styles, mục lục, Section, số trang, Mail Merge, Track Changes, văn bản hành chính (NĐ 30/2020/NĐ-CP), in/PDF |
| Microsoft Excel | 11 | 48 | Ô, định dạng, tham chiếu tương đối/tuyệt đối/hỗn hợp, hàm thống kê, logic, văn bản, ngày giờ, tra cứu, Data Validation, định dạng có điều kiện, biểu đồ, PivotTable, mã lỗi |
| Microsoft PowerPoint | 7 | 40 | Nguyên tắc thiết kế, Slide Master/Theme, SmartArt, biểu đồ, Animation/Morph, Presenter View, hyperlink, xuất bản, kỹ năng thuyết trình |

Mỗi bài gồm **lý thuyết** (bảng tóm tắt, phím tắt, ghi chú), **bài tập** với nút "Xem lời giải chi tiết" (các bước và kết quả) và cuối khóa là **bài trắc nghiệm** có thời gian, xáo trộn câu và đáp án, kèm giải thích từng câu.

Các khối nội dung mới trong dữ liệu bài học (`data/courses.json`): `table` (bảng), `ol` (danh sách đánh số), `note` (tip/warn/info/key), `ex` (bài tập: `title`, `q`, `data` tùy chọn, `steps`, `result`). Nội dung nguồn nằm trong thư mục `office/` (Python), chạy `python3 gen_data.py` để sinh lại dữ liệu. Trình soạn bài của giảng viên giữ nguyên các khối này (chỉ cho sửa tiêu đề và thời lượng của bài có bảng/bài tập).
Lưu ý với Excel: máy dùng dấu phẩy thập phân có thể cần dấu chấm phẩy (;) giữa các đối số hàm.

## 3. Cấu trúc thư mục
```
elearn/
├── index.html  course.html  lesson.html  quiz.html
├── dashboard.html  login.html  instructor.html  certificate.html
├── css/style.css            # biến CSS (light/dark), Grid, Flexbox, responsive, print
├── js/
│   ├── store.js             # tầng dữ liệu: fetch JSON + localStorage
│   ├── ui.js                # header/footer, theme, toast, dialog, hàm el() an toàn XSS
│   └── catalog.js course.js lesson.js quiz.js dashboard.js login.js instructor.js certificate.js
└── data/courses.json users.json   # dữ liệu mẫu (6 khóa, 30 bài, 30 câu hỏi)
```

## 4. Điểm kỹ thuật đáng chú ý khi báo cáo
- **Dữ liệu:** lần đầu `fetch('data/courses.json')`, sau đó lưu vào `localStorage` (key `learnhub.*`); CRUD của giảng viên ghi vào đây. Nút *Reset demo data* khôi phục dữ liệu gốc.
- **An toàn XSS:** mọi văn bản người dùng nhập được đưa vào DOM bằng `textContent`/text node (hàm `el()`), không dùng `innerHTML`.
- **Trạng thái UI:** skeleton khi tải, thông báo lỗi khi fetch thất bại, trạng thái rỗng khi không có kết quả.
- **Accessibility:** skip link, landmark, `aria-expanded` cho accordion, `role=timer/progressbar/alert`, `<dialog>` gốc, tôn trọng `prefers-reduced-motion`.
- **Mật khẩu chỉ là giả lập** (lưu rõ trong JSON) — một ứng dụng thật phải xác thực ở phía server.

## 5. Kiểm thử đã chạy (Playwright + Chrome headless)
39 kiểm tra tự động đều đạt: lọc/tìm/phân trang, khóa bài khi chưa ghi danh, validate form, ghi danh → học → ghi chú → quiz 100% → chứng chỉ, huy hiệu, đánh giá, chặn quyền, CRUD giảng viên, dark mode, không tràn ngang trên mobile 390px, không lỗi console.

## 6. Triển khai (GitHub Pages)
Đẩy thư mục lên GitHub → *Settings → Pages* → chọn nhánh `main` / thư mục gốc. Đường dẫn trong dự án đều là đường dẫn tương đối nên chạy được ở dạng `https://<user>.github.io/<repo>/`.

## 7. Hướng mở rộng
Trình soạn câu hỏi quiz cho giảng viên, nhúng video (trường `video` của bài học đã được hỗ trợ), PWA/Service Worker để học offline, đa ngôn ngữ, và thay `localStorage` bằng REST API thật (json-server hoặc backend).

## Lưu ý khi cập nhật bản mới
Dữ liệu khóa học được lưu trong localStorage của trình duyệt. Từ bản này, nếu dữ liệu kèm theo mới hơn (hằng số `DATA_VERSION` trong `js/store.js`), trình duyệt tự nạp lại các khóa mẫu và vẫn giữ các khóa do giảng viên tự tạo. Nếu vẫn thấy dữ liệu cũ: nhấn Ctrl+F5, hoặc dùng "Reset demo data".
