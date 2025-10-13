package com.codeinsight.repository;

import com.codeinsight.model.User;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;

@ApplicationScoped
public class UserRepository implements PanacheMongoRepository<User> {

    public Optional<User> findBySupabaseId(String supabaseId) {
        return find("supabaseId", supabaseId).firstResultOptional();
    }

    public Optional<User> findByApiKey(String apiKey) {
        return find("apiKey", apiKey).firstResultOptional();
    }

    public Optional<User> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }
}
