package com.codeinsight.repository;

import com.codeinsight.model.User;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import com.mongodb.client.MongoClient;
import org.bson.Document;

@ApplicationScoped
public class UserRepository implements PanacheMongoRepository<User> {

    @Inject
    MongoClient mongoClient;

    /**
     * Find user by Supabase user ID (returns User directly, not Optional)
     */
    public User findByUserId(String userId) {
        return find("userId", userId).firstResult();
    }

    /**
     * Find user by API key (returns User directly, not Optional)
     */
    public User findByApiKey(String apiKey) {
        return find("apiKey", apiKey).firstResult();
    }

    /**
     * Find user by email
     */
    public User findByEmail(String email) {
        return find("email", email).firstResult();
    }

    /**
     * Create MongoDB indexes for performance
     */
    public void ensureIndexes() {
        // Get the Document collection directly from MongoClient
        MongoCollection<Document> collection = mongoClient
            .getDatabase(mongoDatabase().getName())
            .getCollection("users");

        try {
            // Index on userId (unique) - most common query
            collection.createIndex(
                Indexes.ascending("userId"),
                new IndexOptions().unique(true).name("idx_userId")
            );

            // Index on apiKey (unique) - for API key authentication
            collection.createIndex(
                Indexes.ascending("apiKey"),
                new IndexOptions().unique(true).name("idx_apiKey")
            );

            // Index on email - for lookups
            collection.createIndex(
                Indexes.ascending("email"),
                new IndexOptions().name("idx_email")
            );

            // Compound index on plan and tokensUsed - for quota queries
            collection.createIndex(
                Indexes.compoundIndex(
                    Indexes.ascending("plan"),
                    Indexes.descending("tokensUsed")
                ),
                new IndexOptions().name("idx_plan_tokens")
            );

            // Index on createdAt - for reporting and analytics
            collection.createIndex(
                Indexes.descending("createdAt"),
                new IndexOptions().name("idx_createdAt")
            );
        } catch (Exception e) {
            // Log error but don't fail - indexes might already exist
            System.err.println("Failed to create indexes: " + e.getMessage());
        }
    }
}

