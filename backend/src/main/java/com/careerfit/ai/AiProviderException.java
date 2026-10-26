package com.careerfit.ai;

public class AiProviderException extends RuntimeException {
    private final int status;
    public AiProviderException(int status, String message) { super(message); this.status = status; }
    public int getStatus() { return status; }
    public boolean isConfigurationFailure() { return status == 401 || status == 402 || status == 403; }
    public static AiProviderException http(String provider, int status) {
        String detail = switch (status) {
            case 401, 403 -> "từ chối khóa API. Kiểm tra khóa đúng nhà cung cấp và quyền sử dụng.";
            case 402 -> "chưa có đủ credit để chạy yêu cầu này.";
            case 429 -> "đã chạm hạn mức hoặc đang giới hạn tốc độ. Hãy thử lại sau.";
            case 404 -> "không hỗ trợ model đang chọn cho tài khoản này.";
            default -> "chưa xử lý được yêu cầu. Vui lòng thử lại sau.";
        };
        return new AiProviderException(status, provider + " " + detail + " (HTTP " + status + ")");
    }
}
