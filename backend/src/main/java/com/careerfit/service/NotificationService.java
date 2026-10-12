package com.careerfit.service;

import com.careerfit.model.Notification;
import com.careerfit.model.User;
import com.careerfit.repository.NotificationRepository;
import com.careerfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<Notification> getMyNotifications(String userIdentifier) {
        User user = userRepository.findById(userIdentifier)
                .or(() -> userRepository.findByUsername(userIdentifier))
                .or(() -> userRepository.findFirstByEmail(userIdentifier.toLowerCase()))
                .orElse(null);

        if (user == null) {
            return new ArrayList<>();
        }

        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            // Admin nhận các thông báo của chính mình và các thông báo gửi đến 'admin' hoặc user-admin-1
            List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            if (!"user-admin-1".equals(user.getId())) {
                List<Notification> adminRoleNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc("user-admin-1");
                for (Notification n : adminRoleNotifs) {
                    if (!list.contains(n)) {
                        list.add(n);
                    }
                }
            }
            return list;
        }

        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public void markAllAsRead(String userIdentifier) {
        User user = userRepository.findById(userIdentifier)
                .or(() -> userRepository.findByUsername(userIdentifier))
                .or(() -> userRepository.findFirstByEmail(userIdentifier.toLowerCase()))
                .orElse(null);

        if (user == null) return;

        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(user.getId());
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);

        if ("ADMIN".equalsIgnoreCase(user.getRole()) && !"user-admin-1".equals(user.getId())) {
            List<Notification> adminUnread = notificationRepository.findByUserIdAndIsReadFalse("user-admin-1");
            for (Notification n : adminUnread) {
                n.setIsRead(true);
            }
            notificationRepository.saveAll(adminUnread);
        }
    }

    @Transactional
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }
}
