package com.careerfit.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${careerfit.jwt.secret}")
    private String jwtSecret;

    @Value("${careerfit.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate a full access token for authenticated users.
     */
    public String generateToken(String email, String role, String userId) {
        return generateToken(email, role, userId, null, "LOCAL", false);
    }

    public String generateToken(String email, String role, String userId, String username) {
        return generateToken(email, role, userId, username, "LOCAL", false);
    }

    public String generateToken(String email, String role, String userId, String username, String authProvider, Boolean hasCustomPassword) {
        var builder = Jwts.builder()
                .subject(userId)
                .claim("userId", userId)
                .claim("email", email)
                .claim("role", role)
                .claim("authProvider", authProvider != null ? authProvider : "LOCAL")
                .claim("hasCustomPassword", Boolean.TRUE.equals(hasCustomPassword));
        if (username != null && !username.isBlank()) {
            builder.claim("username", username);
        }
        return builder
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Generate a SHORT-LIVED temporary token for Google profile completion.
     * This token carries Google identity but is NOT a valid access token.
     * Expires in 15 minutes.
     */
    public String generateTempRegistrationToken(String email, String name, String provider,
                                                 String providerId, String avatarUrl) {
        return Jwts.builder()
                .subject(email)
                .claim("type", "TEMP_REGISTER")
                .claim("purpose", "GOOGLE_REGISTRATION")
                .claim("name", name)
                .claim("provider", provider)
                .claim("providerId", providerId)
                .claim("avatarUrl", avatarUrl)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000L * 60 * 15)) // 15 minutes
                .signWith(getSigningKey())
                .compact();
    }

    public String extractSubject(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) extractClaims(token).get("role");
    }

    public String extractClaim(String token, String claimKey) {
        return (String) extractClaims(token).get(claimKey);
    }

    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
