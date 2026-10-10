package com.careerfit.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI careerFitOpenAPI() {
        // Khai báo scheme JWT Bearer để có thể test API cần token ngay trên Swagger
        SecurityScheme jwtScheme = new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .name("bearerAuth");

        return new OpenAPI()
                .info(new Info()
                        .title("CareerFit API")
                        .description(
                            "RESTful API cho hệ thống tuyển dụng CareerFit (SWP391)\n\n" +
                            "**Hướng dẫn test có token:**\n" +
                            "1. Gọi POST /api/auth/login để lấy token.\n" +
                            "2. Nhấn nút 'Authorize' ở trên, dán token vào ô 'Value' rồi nhấn Authorize.\n" +
                            "3. Tất cả request tiếp theo sẽ tự gắn token."
                        )
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Team SWP391")
                                .email("team@careerfit.vn"))
                )
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth", jwtScheme));
    }
}
