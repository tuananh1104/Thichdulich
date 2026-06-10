package com.example.thichdulich.chatbot;

import org.springframework.stereotype.Service;

@Service
public class ChatPolicyService {
    public String getPolicies() {
        return """
                Chính sách thanh toán:
                - QR/chuyển khoản: thanh toán theo mã QR hoặc link thanh toán được tạo cho đơn.
                - COD: cần đặt cọc trước 30%, phần còn lại thanh toán khi đi tour.

                Chính sách hủy/hoàn tiền:
                - Khách hủy trước giờ khởi hành từ 24 giờ trở lên: hoàn 100%.
                - Khách hủy trước giờ khởi hành dưới 24 giờ: không hoàn.
                - Nhà cung cấp hủy tour: hoàn 100%.
                - Admin/hệ thống hủy tour: hoàn 100%.
                - Hoàn tiền cần thông tin ngân hàng chính xác để admin xử lý.
                """;
    }
}
