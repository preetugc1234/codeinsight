package com.codeinsight.repository;

import com.codeinsight.model.Job;
import io.quarkus.mongodb.panache.PanacheMongoRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class JobRepository implements PanacheMongoRepository<Job> {

    /**
     * Find job by job ID (returns Job directly, not Optional)
     */
    public Job findByJobId(String jobId) {
        return find("jobId", jobId).firstResult();
    }

    /**
     * Find all jobs by user ID
     */
    public List<Job> findByUserId(String userId) {
        return find("userId", userId).list();
    }

    /**
     * Find recent jobs by user ID with limit
     */
    public List<Job> findRecentByUserId(String userId, int limit) {
        return find("userId = ?1 order by createdAt desc", userId)
                .page(0, limit)
                .list();
    }
}
