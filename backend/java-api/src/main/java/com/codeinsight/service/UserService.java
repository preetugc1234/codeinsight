package com.codeinsight.service;

import com.codeinsight.model.User;
import com.codeinsight.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDateTime;

@ApplicationScoped
public class UserService {

    @Inject
    UserRepository userRepository;

    /**
     * Get or create user by Supabase user ID
     */
    public User getOrCreateUser(String userId, String email, String plan) {
        User user = userRepository.findByUserId(userId);

        if (user == null) {
            // Create new user
            user = new User();
            user.userId = userId;
            user.email = email;
            user.setPlan(plan != null ? plan : "lite");
            userRepository.persist(user);

            // Create indexes on first user creation
            ensureIndexes();
        }

        return user;
    }

    /**
     * Get user by Supabase user ID
     */
    public User getUserByUserId(String userId) {
        return userRepository.findByUserId(userId);
    }

    /**
     * Get user by API key
     */
    public User getUserByApiKey(String apiKey) {
        return userRepository.findByApiKey(apiKey);
    }

    /**
     * Update user plan
     */
    public User updateUserPlan(String userId, String plan) {
        User user = userRepository.findByUserId(userId);
        if (user != null) {
            user.setPlan(plan);
            user.updatedAt = LocalDateTime.now();
            userRepository.update(user);
        }
        return user;
    }

    /**
     * Consume tokens for a user
     */
    public boolean consumeTokens(String userId, Long tokensUsed) {
        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return false;
        }

        if (!user.hasTokensAvailable(tokensUsed)) {
            return false;
        }

        user.consumeTokens(tokensUsed);
        userRepository.update(user);
        return true;
    }

    /**
     * Check if user can make request (rate limiting)
     */
    public boolean canMakeRequest(String userId) {
        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        // Reset counter if time window has passed
        if (now.isAfter(user.requestCountResetAt)) {
            user.requestCount = 0;
            user.requestCountResetAt = now.plusMinutes(1);
        }

        // Check rate limit
        if (user.requestCount >= user.getRateLimit()) {
            return false;
        }

        // Increment request count
        user.requestCount++;
        user.updatedAt = now;
        userRepository.update(user);

        return true;
    }

    /**
     * Get remaining requests for user in current window
     */
    public int getRemainingRequests(String userId) {
        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();

        // Reset if window expired
        if (now.isAfter(user.requestCountResetAt)) {
            return user.getRateLimit();
        }

        return Math.max(0, user.getRateLimit() - user.requestCount);
    }

    /**
     * Get seconds until rate limit reset
     */
    public long getSecondsUntilReset(String userId) {
        User user = userRepository.findByUserId(userId);
        if (user == null) {
            return 60;
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(user.requestCountResetAt)) {
            return 0;
        }

        return java.time.Duration.between(now, user.requestCountResetAt).getSeconds();
    }

    /**
     * Reset monthly tokens for a user (called by scheduled job)
     */
    public void resetMonthlyTokens(String userId) {
        User user = userRepository.findByUserId(userId);
        if (user != null) {
            user.resetMonthlyTokens();
            userRepository.update(user);
        }
    }

    /**
     * Ensure MongoDB indexes exist for performance
     */
    private void ensureIndexes() {
        try {
            // Indexes are created via UserRepository on first access
            userRepository.ensureIndexes();
        } catch (Exception e) {
            System.err.println("Failed to create indexes: " + e.getMessage());
        }
    }

    /**
     * Delete user (for GDPR compliance)
     */
    public boolean deleteUser(String userId) {
        User user = userRepository.findByUserId(userId);
        if (user != null) {
            userRepository.delete(user);
            return true;
        }
        return false;
    }

    /**
     * Update user email
     */
    public User updateUserEmail(String userId, String newEmail) {
        User user = userRepository.findByUserId(userId);
        if (user != null) {
            user.email = newEmail;
            user.updatedAt = LocalDateTime.now();
            userRepository.update(user);
        }
        return user;
    }
}
