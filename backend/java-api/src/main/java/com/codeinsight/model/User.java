package com.codeinsight.model;

import org.bson.types.ObjectId;
import io.quarkus.mongodb.panache.common.MongoEntity;

import java.time.LocalDateTime;
import java.util.UUID;

@MongoEntity(collection = "users")
public class User {
    public ObjectId id; // MongoDB internal ID
    public String userId; // Supabase user ID (UUID from auth.users)
    public String email;
    public String plan; // "lite", "pro", "business"
    public String apiKey; // API key for programmatic access
    public Long tokensUsed; // Tokens consumed this month
    public Long tokensLimit; // Monthly token quota based on plan
    public Integer requestCount; // Request count for rate limiting
    public LocalDateTime requestCountResetAt; // When to reset request count
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    // Plan token limits
    public static final Long TOKENS_LITE = 200000L;
    public static final Long TOKENS_PRO = 500000L;
    public static final Long TOKENS_BUSINESS = 4000000L;

    // Rate limits (requests per minute)
    public static final Integer RATE_LIMIT_LITE = 10;
    public static final Integer RATE_LIMIT_PRO = 30;
    public static final Integer RATE_LIMIT_BUSINESS = 100;

    public User() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.tokensUsed = 0L;
        this.plan = "lite";
        this.tokensLimit = TOKENS_LITE;
        this.requestCount = 0;
        this.requestCountResetAt = LocalDateTime.now().plusMinutes(1);
        this.apiKey = generateApiKey();
    }

    public void setPlan(String plan) {
        this.plan = plan;
        switch (plan) {
            case "lite":
                this.tokensLimit = TOKENS_LITE;
                break;
            case "pro":
                this.tokensLimit = TOKENS_PRO;
                break;
            case "business":
                this.tokensLimit = TOKENS_BUSINESS;
                break;
            default:
                this.tokensLimit = TOKENS_LITE;
        }
    }

    public Integer getRateLimit() {
        switch (this.plan) {
            case "lite":
                return RATE_LIMIT_LITE;
            case "pro":
                return RATE_LIMIT_PRO;
            case "business":
                return RATE_LIMIT_BUSINESS;
            default:
                return RATE_LIMIT_LITE;
        }
    }

    public boolean hasTokensAvailable(Long tokensNeeded) {
        return (tokensUsed + tokensNeeded) <= tokensLimit;
    }

    public void consumeTokens(Long tokens) {
        this.tokensUsed += tokens;
        this.updatedAt = LocalDateTime.now();
    }

    public void resetMonthlyTokens() {
        this.tokensUsed = 0L;
        this.updatedAt = LocalDateTime.now();
    }

    private String generateApiKey() {
        return "ci_" + UUID.randomUUID().toString().replace("-", "");
    }
}
