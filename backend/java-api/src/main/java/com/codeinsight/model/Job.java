package com.codeinsight.model;

import org.bson.types.ObjectId;
import io.quarkus.mongodb.panache.common.MongoEntity;

import java.time.LocalDateTime;
import java.util.Map;

@MongoEntity(collection = "jobs")
public class Job {
    public ObjectId id;
    public String jobId; // UUID for external reference
    public String userId;
    public String type; // "review", "debug", "architecture"
    public String status; // "queued", "processing", "completed", "failed"
    public Map<String, Object> input;
    public Map<String, Object> results;
    public Long tokensUsed;
    public String errorMessage;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public LocalDateTime completedAt;

    public Job() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = "queued";
        this.tokensUsed = 0L;
    }
}
