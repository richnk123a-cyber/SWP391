package com.careerfit.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtils jwtUtils;

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        
        String targetUrl;

        // Nếu ID null, tức là user mới chưa lưu vào DB -> Đăng ký tạm
        if (oAuth2User.getDbUser().getId() == null) {
            String tempToken = jwtUtils.generateTempRegistrationToken(
                    oAuth2User.getDbUser().getEmail(),
                    oAuth2User.getDbUser().getUsername(),
                    oAuth2User.getDbUser().getAuthProvider(),
                    oAuth2User.getDbUser().getProviderId(),
                    oAuth2User.getDbUser().getAvatarUrl()
            );

            // Chuyển hướng sang trang điền form thông tin
            targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth-register")
                    .queryParam("registerToken", tempToken)
                    .build().toUriString();
        } else {
            // Kiểm tra trạng thái khóa tài khoản
            if ("LOCKED".equals(oAuth2User.getDbUser().getStatus())) {
                targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/login")
                        .queryParam("error", "locked")
                        .build().toUriString();
                getRedirectStrategy().sendRedirect(request, response, targetUrl);
                return;
            }

            // User đã tồn tại, cấp token thật
            String token = jwtUtils.generateToken(
                    oAuth2User.getDbUser().getEmail(),
                    oAuth2User.getDbUser().getRole(),
                    oAuth2User.getDbUser().getId(),
                    oAuth2User.getDbUser().getUsername(),
                    oAuth2User.getDbUser().getAuthProvider(),
                    oAuth2User.getDbUser().getHasCustomPassword()
            );

            // Redirect sang oauth-success
            targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth-success")
                    .queryParam("token", token)
                    .build().toUriString();
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
