package com.careerfit.repository;

import com.careerfit.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findFirstByEmail(String email);
    Optional<User> findByEmailAndAuthProvider(String email, String authProvider);
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndAuthProvider(String username, String authProvider);
    Optional<User> findFirstByEmailAndRole(String email, String role);
    Optional<User> findByUsernameAndRole(String username, String role);
    List<User> findAllByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndAuthProvider(String email, String authProvider);
    boolean existsByUsername(String username);

    // Find by OAuth provider identity — used for account lookup after first link
    Optional<User> findByProviderIdAndAuthProvider(String providerId, String authProvider);

    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:identifier) OR LOWER(u.username) = LOWER(:identifier) OR u.id = :identifier")
    List<User> findAllByEmailOrUsernameOrId(@Param("identifier") String identifier);
}

