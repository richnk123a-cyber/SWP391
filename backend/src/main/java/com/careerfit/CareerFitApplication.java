package com.careerfit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

@SpringBootApplication
@EnableScheduling
public class CareerFitApplication {

    public static void main(String[] args) {
        // 1. Kết nối vào DB master để tạo careerfit_db nếu chưa có
        createDatabaseIfNotExists();
        
        // 2. Bắt đầu chạy Spring Boot
        SpringApplication.run(CareerFitApplication.class, args);
    }

    private static void createDatabaseIfNotExists() {
        // Danh sách các cổng và tên Server phổ biến nhất của SQL Server
        String[] masterUrls = {
            "jdbc:sqlserver://localhost:1433;databaseName=master;integratedSecurity=true;encrypt=false;trustServerCertificate=true;",
            "jdbc:sqlserver://localhost\\SQLEXPRESS;databaseName=master;integratedSecurity=true;encrypt=false;trustServerCertificate=true;"
        };

        for (String url : masterUrls) {
            try (Connection conn = DriverManager.getConnection(url);
                 Statement stmt = conn.createStatement()) {
                 
                String sql = "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'careerfit_db') " +
                             "BEGIN CREATE DATABASE careerfit_db; END;";
                stmt.execute(sql);
                System.out.println("✅ [AUTO] Kết nối thành công qua: " + url);
                System.out.println("✅ [AUTO] Database 'careerfit_db' đã sẵn sàng!");
                return; // Nếu tạo thành công thì kết thúc luôn

            } catch (Exception e) {
                System.out.println("⚠️ [AUTO] Bỏ qua URL: " + url + " (Đang thử cổng khác...)");
            }
        }
        
        System.err.println("❌ [AUTO] THẤT BẠI: Không thể tự động tạo Database. Hãy đảm bảo bạn đã bật TCP/IP trong SQL Server Configuration Manager!");
    }
}