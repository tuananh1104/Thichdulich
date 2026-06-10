package com.example.thichdulich.chatbot;

import org.springframework.stereotype.Service;

@Service
public class WebsiteHelpService {
    public String getWebsiteHelp(String query) {
        String normalized = IntentDetector.normalize(query);
        if (normalized.contains("quen ma don")) {
            return "Nếu quên mã đơn, người dùng nên đăng nhập vào mục Đặt tour của tôi để xem lại danh sách đơn. Nếu vẫn không thấy, gửi liên hệ kèm email/số điện thoại đặt tour để admin kiểm tra.";
        }
        if (normalized.contains("loi thanh toan") || normalized.contains("website bi loi")) {
            return "Khi gặp lỗi thanh toán, người dùng nên tải lại trang, kiểm tra trạng thái đơn trong Đặt tour của tôi, không thanh toán lại nhiều lần nếu chưa rõ trạng thái, và gửi liên hệ kèm mã đơn nếu cần hỗ trợ.";
        }
        if (normalized.contains("dang nhap") || normalized.contains("mat khau") || normalized.contains("otp")) {
            return "Người dùng có thể đăng nhập/đăng ký bằng email. Nếu quên mật khẩu, dùng chức năng Quên mật khẩu để nhận OTP qua email và đặt lại mật khẩu.";
        }
        return "Website hỗ trợ tìm tour, xem chi tiết tour, đặt tour, thanh toán QR/COD, quản lý đơn, gửi đánh giá, báo cáo tour và liên hệ hỗ trợ.";
    }
}
