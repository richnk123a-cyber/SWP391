package com.careerfit.security;

import com.careerfit.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {

    private final OAuth2User oAuth2User;
    private final User dbUser;

    public CustomOAuth2User(OAuth2User oAuth2User, User dbUser) {
        this.oAuth2User = oAuth2User;
        this.dbUser = dbUser;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return oAuth2User.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + dbUser.getRole()));
    }

    @Override
    public String getName() {
        return dbUser.getEmail();
    }

    public User getDbUser() {
        return dbUser;
    }
}
