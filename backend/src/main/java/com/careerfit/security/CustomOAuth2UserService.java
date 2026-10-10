package com.careerfit.security;

import com.careerfit.model.User;
import com.careerfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String provider = registrationId.toUpperCase(); // GOOGLE, MICROSOFT

        // Extract attributes
        String email = null;
        String name = null;
        String providerId = null;
        String avatar = null;

        if ("GOOGLE".equals(provider)) {
            email = oAuth2User.getAttribute("email");
            name = oAuth2User.getAttribute("name");
            providerId = oAuth2User.getAttribute("sub");
            avatar = oAuth2User.getAttribute("picture");

            // Security: only trust verified Google emails
            Boolean emailVerified = oAuth2User.getAttribute("email_verified");
            if (emailVerified == null || !emailVerified) {
                throw new OAuth2AuthenticationException("Google email chua duoc xac minh. Vui long xac minh email truoc.");
            }
                } else if ("MICROSOFT".equals(provider)) {
            email = oAuth2User.getAttribute("mail");
            name = oAuth2User.getAttribute("displayName");
            providerId = oAuth2User.getAttribute("id");
            
            // Aggressive fallback for Microsoft email attributes
            if (email == null) email = oAuth2User.getAttribute("userPrincipalName");
            if (email == null) email = oAuth2User.getAttribute("email");
            if (email == null) email = oAuth2User.getAttribute("preferred_username");
            
            // If it's a weird GUID (which sometimes happens with preferred_username for personal accounts)
            if (email != null && !email.contains("@")) {
                email = null;
            }
        } else {
            throw new OAuth2AuthenticationException("Provider khong duoc ho tro: " + registrationId);
        }

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Khong lay duoc email tu " + provider + ". Vui long thu lai.");
        }

        email = email.toLowerCase().trim();

        // SPECIAL CASE: Designated System Administrator (trongtien6571@gmail.com)
        if ("trongtien6571@gmail.com".equalsIgnoreCase(email)) {
            User adminUser = userRepository.findFirstByEmail(email).orElse(null);
            if (adminUser == null) {
                adminUser = User.builder()
                        .id("user-admin-1")
                        .email(email)
                        .username(name != null ? name : "trongtien_admin")
                        .role("ADMIN")
                        .status("ACTIVE")
                        .authProvider(provider)
                        .providerId(providerId)
                        .avatarUrl(avatar)
                        .hasCustomPassword(false)
                        .build();
                userRepository.save(adminUser);
                log.info("Initialized system ADMIN account for Google OAuth: {}", email);
            } else {
                boolean updated = false;
                if (!"ADMIN".equals(adminUser.getRole())) {
                    adminUser.setRole("ADMIN");
                    updated = true;
                }
                if (!"ACTIVE".equals(adminUser.getStatus())) {
                    adminUser.setStatus("ACTIVE");
                    updated = true;
                }
                if (providerId != null && !providerId.equals(adminUser.getProviderId())) {
                    adminUser.setProviderId(providerId);
                    adminUser.setAuthProvider(provider);
                    updated = true;
                }
                if (avatar != null && !avatar.equals(adminUser.getAvatarUrl())) {
                    adminUser.setAvatarUrl(avatar);
                    updated = true;
                }
                if (updated) {
                    userRepository.save(adminUser);
                    log.info("Synchronized system ADMIN account for Google OAuth: {}", email);
                }
            }
            return new CustomOAuth2User(oAuth2User, adminUser);
        }

        Optional<User> userOptional;

        // 1. First try to find by provider + providerId (most reliable after first link)
        if (providerId != null) {
            userOptional = userRepository.findByProviderIdAndAuthProvider(providerId, provider);
            if (userOptional.isPresent()) {
                log.info("Found existing [{}] user by providerId: {}", provider, email);
                return new CustomOAuth2User(oAuth2User, userOptional.get());
            }
        }

        // 2. Then try by email AND provider (this means they already registered with THIS provider)
        userOptional = userRepository.findByEmailAndAuthProvider(email, provider);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            boolean needSave = false;
            if (providerId != null && !providerId.equals(user.getProviderId())) {
                user.setProviderId(providerId);
                needSave = true;
            }
            if (avatar != null && !avatar.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(avatar);
                needSave = true;
            }
            if (needSave) {
                userRepository.save(user);
                log.info("Synchronized providerId/avatar for existing user [{}]: {}", user.getId(), email);
            }
            log.info("Found existing [{}] user by email: {}", provider, email);
            return new CustomOAuth2User(oAuth2User, user);
        }

        // 2b. Fallback: Find by email regardless of auth provider, and link provider (supports seed users & legacy accounts)
        userOptional = userRepository.findFirstByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setAuthProvider(provider);
            if (providerId != null) user.setProviderId(providerId);
            if (avatar != null && user.getAvatarUrl() == null) user.setAvatarUrl(avatar);
            userRepository.save(user);
            log.info("Linked existing user by email [{}] with provider [{}]: {}", user.getId(), provider, email);
            return new CustomOAuth2User(oAuth2User, user);
        }

        // 3. Brand new OAuth user -> Return transient User (id = null) to complete profile registration
        String autoUsername = email.split("@")[0].toLowerCase();
        User user = User.builder()
                .email(email)
                .username(autoUsername)
                .authProvider(provider)
                .providerId(providerId)
                .avatarUrl(avatar)
                .hasCustomPassword(false)
                .build();
        log.info("New [{}] OAuth user detected, profile completion required: {}", provider, email);

        return new CustomOAuth2User(oAuth2User, user);
    }
}
