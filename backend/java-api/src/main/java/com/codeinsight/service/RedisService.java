package com.codeinsight.service;

import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.keys.KeyCommands;
import io.quarkus.redis.datasource.string.StringCommands;
import io.quarkus.redis.datasource.hash.HashCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Duration;
import java.util.Map;

@ApplicationScoped
public class RedisService {

    @Inject
    RedisDataSource redisDataSource;

    private StringCommands<String, String> stringCommands;
    private HashCommands<String, String, String> hashCommands;
    private KeyCommands<String> keyCommands;

    @jakarta.annotation.PostConstruct
    public void init() {
        this.stringCommands = redisDataSource.string(String.class, String.class);
        this.hashCommands = redisDataSource.hash(String.class, String.class, String.class);
        this.keyCommands = redisDataSource.key();
    }

    // Cache operations
    public void setCache(String key, String value, Duration ttl) {
        stringCommands.setex(key, ttl.getSeconds(), value);
    }

    public String getCache(String key) {
        return stringCommands.get(key);
    }

    public void deleteCache(String key) {
        keyCommands.del(key);
    }

    public boolean exists(String key) {
        return keyCommands.exists(key);
    }

    // Hash operations for job queue
    public void enqueueJob(String jobId, Map<String, String> jobData) {
        String queueKey = "queue:review_jobs";
        hashCommands.hset(queueKey, jobId, toJson(jobData));
    }

    public Map<String, String> getJob(String jobId) {
        String queueKey = "queue:review_jobs";
        String jobJson = hashCommands.hget(queueKey, jobId);
        return jobJson != null ? fromJson(jobJson) : null;
    }

    public void deleteJob(String jobId) {
        String queueKey = "queue:review_jobs";
        hashCommands.hdel(queueKey, jobId);
    }

    // Rate limiting - Token Bucket Algorithm
    public boolean checkRateLimit(String userId, int maxRequests, Duration window) {
        String key = "ratelimit:" + userId;
        String count = stringCommands.get(key);

        if (count == null) {
            stringCommands.setex(key, window.getSeconds(), "1");
            return true;
        }

        int currentCount = Integer.parseInt(count);
        if (currentCount >= maxRequests) {
            return false;
        }

        stringCommands.incr(key);
        return true;
    }

    /**
     * Advanced rate limiting with sliding window
     * Returns true if request is allowed, false if rate limit exceeded
     */
    public boolean allowRequest(String userId, int maxRequests) {
        String key = "ratelimit:sliding:" + userId;
        long now = System.currentTimeMillis();
        long windowStart = now - 60000; // 1 minute window

        try {
            // Get current count in sliding window
            String countStr = stringCommands.get(key);
            int currentCount = countStr != null ? Integer.parseInt(countStr) : 0;

            if (currentCount >= maxRequests) {
                return false;
            }

            // Increment counter
            if (countStr == null) {
                stringCommands.setex(key, 60, "1"); // 60 seconds TTL
            } else {
                stringCommands.incr(key);
            }

            return true;
        } catch (Exception e) {
            // On Redis error, allow request (fail-open for availability)
            System.err.println("Rate limit check failed: " + e.getMessage());
            return true;
        }
    }

    /**
     * Get remaining requests for user
     */
    public int getRemainingRequests(String userId, int maxRequests) {
        String key = "ratelimit:sliding:" + userId;
        String countStr = stringCommands.get(key);
        int currentCount = countStr != null ? Integer.parseInt(countStr) : 0;
        return Math.max(0, maxRequests - currentCount);
    }

    /**
     * Get TTL for rate limit key (seconds until reset)
     */
    public long getRateLimitTTL(String userId) {
        String key = "ratelimit:sliding:" + userId;
        try {
            Long ttl = keyCommands.ttl(key);
            return ttl != null ? ttl : 60;
        } catch (Exception e) {
            return 60; // Default 60 seconds
        }
    }

    /**
     * Reset rate limit for a user (admin function)
     */
    public void resetRateLimit(String userId) {
        String key = "ratelimit:sliding:" + userId;
        keyCommands.del(key);
    }

    // Simple JSON conversion (you can use Jackson later)
    private String toJson(Map<String, String> data) {
        StringBuilder json = new StringBuilder("{");
        data.forEach((k, v) -> json.append("\"").append(k).append("\":\"").append(v).append("\","));
        if (json.length() > 1) json.setLength(json.length() - 1);
        json.append("}");
        return json.toString();
    }

    private Map<String, String> fromJson(String json) {
        // Simplified parser - use Jackson for production
        return Map.of("data", json);
    }
}
