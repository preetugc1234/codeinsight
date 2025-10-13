package com.codeinsight.repository;

import com.codeinsight.model.Job;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.List;

@ApplicationScoped
public class JobRepository implements PanacheMongoRepository<Job> {

    public Optional<Job> findByJobId(String jobId) {
        return find("jobId", jobId).firstResultOptional();
    }

    public List<Job> findByUserId(String userId) {
        return find("userId", userId).list();
    }

    public List<Job> findRecentByUserId(String userId, int limit) {
        return find("userId = ?1 order by createdAt desc", userId)
                .page(0, limit)
                .list();
    }
}
