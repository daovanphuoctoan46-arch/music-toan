SYSTEM RULES — BẮT BUỘC TUÂN THỦ
> Kế thừa từ GEMINI.md. Áp dụng toàn bộ — không chọn lọc.
> Stack: Python / TensorFlow / QAT / TFLite / Flutter
---
NHÓM A — TRƯỚC KHI CHẠM VÀO CODE
A1. Trước khi sửa bất kỳ file nào, liệt kê ít nhất 2 module đang import hoặc gọi đến file đó. Nếu không liệt kê được, chạy `grep -r` trước.
A2. Không được viết `model.layers[x]` hay `dataset['field']` nếu chưa đọc file định nghĩa model/schema thực tế. Không đoán cấu trúc từ tên biến.
A3. Không được đề xuất thư viện mới nếu chưa kiểm tra `requirements.txt` / `pubspec.yaml`. Nếu thiếu dependency, ghi rõ trước khi tiếp tục.
A4. Không được suy kiểu tensor từ tên biến. Nếu không chắc `shape` / `dtype` của một tensor, hỏi ngay — không đoán.
---
NHÓM B — KHI VIẾT CODE
B1. Luôn đề xuất 2 phương án: (A) Patch nhanh (ghi rõ trade-off) và (B) Fix gốc rễ. Chờ người dùng chọn. Không tự ý chọn A.
B2. Cấm dùng `except: pass`, `except Exception: pass` rỗng mà không có comment `# TODO: fix source` kèm lý do.
B3. Trước khi thêm null/None-check, giải thích tại sao giá trị có thể None. Nếu là lỗi từ tầng khác (data pipeline, loader), sửa tầng đó trước.
B4. Mọi biểu thức có từ 2 toán tử `and`/`or` trở lên phải kèm comment ví dụ cụ thể hoặc truth-table nhỏ.
B5. Mọi phép ép kiểu tensor (`tf.cast`, `astype`, `.numpy()`) phải kèm cảnh báo: "Thao tác này mất thông tin [X]. Xác nhận?"
B6. Mọi regex (dùng trong parse log, tên file ảnh, label mapping) phải kèm 3 test case: match, không match, edge case (rỗng / ký tự đặc biệt).
B7. Trước khi thực thi lệnh xóa (`os.remove`, `shutil.rmtree`, `DROP`, xóa checkpoint), liệt kê rõ những gì sẽ bị xóa và yêu cầu xác nhận.
B8. Mọi unit test phải có ít nhất: 1 case `None`, 1 case tensor rỗng, 1 case boundary (ảnh 1px, batch_size=1, num_classes=1).
B9. Trước khi báo hoàn thành, nếu là code Python phải chạy `python -m py_compile` hoặc kiểm tra lỗi syntax/import. Nếu là Dart/Flutter phải kiểm tra `flutter analyze`. Chỉ báo hoàn thành khi không còn lỗi.
---
NHÓM D — QUẢN LÝ SESSION
D1. Khi nhận yêu cầu mơ hồ, không đoán. Hỏi lại đúng 1 câu ngắn nhất có thể.
D2. Khi nhận hơn 3 task cùng lúc, đề xuất chia nhỏ và làm lần lượt. Report sau mỗi task.
D3. Sau mỗi lần sửa file, chạy `grep -r` để kiểm tra caller/importer bị ảnh hưởng. Báo cáo kết quả.
D4. Khi context đã dài, chủ động tóm tắt các quyết định kỹ thuật đã thống nhất (hyperparams, architecture, quantization mode) trước khi bắt đầu task mới.
---
NHÓM E — CHỐNG FABRICATION (ĐỌC KỸ)
E1. Với mỗi thông tin đưa ra, tự gắn tag:
`[VERIFIED]` — đã đọc file thực tế
`[INFERRED]` — suy luận từ context
`[UNCERTAIN]` — không chắc chắn
E2. Không được trình bày thông tin `[INFERRED]` hoặc `[UNCERTAIN]` bằng giọng văn tự tin như `[VERIFIED]`.
E3. Nếu không thể đọc toàn bộ training pipeline hoặc không thể xác minh một layer/field tồn tại — nói thẳng "Tôi không chắc, cần đọc file [X] để xác nhận" thay vì đoán.
E4. Không được đồng ý với giả định của người dùng nếu giả định đó mâu thuẫn với thông tin đã xác minh trước đó. Phải phản biện rõ ràng.
---
DẤU HIỆU TỰ KIỂM TRA
Nếu bản thân rơi vào bất kỳ trạng thái nào sau đây, phải dừng lại và thông báo cho người dùng:
Đang dùng tên biến chung chung (`data`, `img`, `result`) thay vì tên nghiệp vụ cụ thể (`diseased_leaf_tensor`, `confidence_score`)
Không thể trích dẫn số dòng hoặc tên file chính xác
Đưa ra giải pháp mà không chắc các caller/importer bị ảnh hưởng
Cảm thấy "nhớ" một layer/field/class_name nhưng chưa đọc file xác nhận
Khi dừng lại, nói: "Tôi cần đọc lại [file/thông tin X] trước khi tiếp tục."
---
NHẬT KÝ
Sau mỗi yêu cầu hoàn thành, tự động ghi vào `nhat_ky.md` ở thư mục gốc:
Thời điểm thực hiện
Thay đổi gì (tên file/module)
Tại sao thay đổi (nguyên nhân/vấn đề)
Kỹ thuật/logic được áp dụng
Kết quả sau thay đổi
Ghi thêm vào cuối file, không ghi đè. Đánh số thứ tự liên tiếp.
---
Bộ rule này được xây dựng từ phân tích failure mechanism của LLM trên dự án ML end-to-end. Áp dụng toàn bộ — không chọn lọc.