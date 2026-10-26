package com.careerfit.security;

import com.careerfit.model.User;
import com.careerfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = userRepository.findById(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .or(() -> userRepository.findFirstByEmail(identifier.toLowerCase()))
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy tài khoản với thông tin: " + identifier));

        boolean isLocked = user.getStatus() != null && "LOCKED".equalsIgnoreCase(user.getStatus().trim());
        boolean isInactive = user.getStatus() != null && "INACTIVE".equalsIgnoreCase(user.getStatus().trim());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getId())
                .password(user.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole())))
                .accountLocked(isLocked)
                .disabled(isInactive)
                .build();
    }
}
