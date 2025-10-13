package com.codeinsight.api;

import com.codeinsight.model.Job;
import com.codeinsight.model.User;
import com.codeinsight.repository.JobRepository;
import com.codeinsight.repository.UserRepository;
import com.codeinsight.service.RedisService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Path("/api/review")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReviewResource {

    @Inject
    JobRepository jobRepository;

    @Inject
    UserRepository userRepository;

    @Inject
    RedisService redisService;

    @POST
    @Transactional
    public Response createReview(
            @HeaderParam("Authorization") String authHeader,
            ReviewRequest request
    ) {
        // Validate request
        if (request == null || request.fileContent == null || request.fileContent.isEmpty()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "file_content is required"))
                    .build();
        }

        // Extract user ID from auth header (simplified)
        String userId = extractUserId(authHeader);
        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "Invalid or missing authorization"))
                    .build();
        }

        // Check rate limit
        if (!redisService.checkRateLimit(userId, 100, Duration.ofMinutes(1))) {
            return Response.status(429)
                    .entity(Map.of("error", "Rate limit exceeded"))
                    .build();
        }

        // Get user and check quota
        Optional<User> userOpt = userRepository.findBySupabaseId(userId);
        if (userOpt.isEmpty()) {
            // Create demo user for testing
            User user = new User();
            user.supabaseId = userId;
            user.email = "demo@example.com";
            userRepository.persist(user);
            userOpt = Optional.of(user);
        }

        User user = userOpt.get();
        if (user.tokensUsed >= user.tokensLimit) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of(
                            "error", "Token quota exceeded",
                            "tokens_used", user.tokensUsed,
                            "tokens_limit", user.tokensLimit
                    ))
                    .build();
        }

        // Create job
        String jobId = UUID.randomUUID().toString();
        Job job = new Job();
        job.jobId = jobId;
        job.userId = userId;
        job.type = "review";
        job.status = "queued";
        job.input = Map.of(
                "file_path", request.filePath != null ? request.filePath : "unknown",
                "file_content", request.fileContent,
                "language", request.language != null ? request.language : "auto"
        );

        jobRepository.persist(job);

        // Enqueue to Redis
        redisService.enqueueJob(jobId, Map.of(
                "job_id", jobId,
                "user_id", userId,
                "type", "review"
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("job_id", jobId);
        response.put("status", "queued");
        response.put("message", "Review job created successfully");

        return Response.ok(response).build();
    }

    @GET
    @Path("/{jobId}")
    public Response getJobStatus(@PathParam("jobId") String jobId) {
        Optional<Job> jobOpt = jobRepository.findByJobId(jobId);

        if (jobOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Job not found"))
                    .build();
        }

        Job job = jobOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("job_id", job.jobId);
        response.put("status", job.status);
        response.put("type", job.type);
        response.put("created_at", job.createdAt.toString());

        if (job.results != null) {
            response.put("results", job.results);
        }

        if (job.errorMessage != null) {
            response.put("error_message", job.errorMessage);
        }

        return Response.ok(response).build();
    }

    private String extractUserId(String authHeader) {
        // Simplified - implement JWT validation later
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return "demo-user-id";
        }
        return null;
    }

    public static class ReviewRequest {
        public String filePath;
        public String fileContent;
        public String language;
        public String cursorContext;
    }
}
