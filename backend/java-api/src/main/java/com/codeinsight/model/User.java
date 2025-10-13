package com.codeinsight.model;

import org.bson.types.ObjectId;
import io.quarkus.mongodb.panache.common.MongoEntity;

import java.time.LocalDateTime;

@MongoEntity(collection = "users")
public class User {
    public ObjectId id;
    public String supabaseId;
    public String email;
    public String plan; // "lite", "pro", "business"
    public String apiKey;
    public Long tokensUsed;
    public Long tokensLimit;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    public User() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.tokensUsed = 0L;
        this.plan = "lite";
        this.tokensLimit = 200000L;
    }
}
