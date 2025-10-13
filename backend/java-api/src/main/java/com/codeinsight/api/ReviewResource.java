package com.codeinsight.api;

import com.codeinsight.model.Job;
import com.codeinsight.model.User;
import com.codeinsight.repository.JobRepository;
import com.codeinsight.service.JWTService;
import com.codeinsight.service.UserService;
import com.codeinsight.service.RedisService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Path("/api/review")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReviewResource {

    @Inject
    JobRepository jobRepository;

    @Inject
    JWTService jwtService;

    @Inject
    UserService userService;

    @Inject
    RedisService redisService;

    @POST
    @Transactional
    public Response createReview(
            @HeaderParam("Authorization") String authHeader,
            ReviewRequest request
    ) {
        try {
            // Validate request
            if (request == null || request.fileContent == null || request.fileContent.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "file_content is required"))
                        .build();
            }

            // Validate JWT and extract user ID
            String userId = jwtService.validateTokenAndGetUserId(authHeader);
            String email = jwtService.extractEmail(authHeader);

            // Get or create user
            User user = userService.getOrCreateUser(userId, email, "lite");

            // Check rate limit with 429 response
            if (!redisService.allowRequest(userId, user.getRateLimit())) {
                long retryAfter = redisService.getRateLimitTTL(userId);
                return Response.status(429)
                        .entity(Map.of(
                                "error", "Rate limit exceeded",
                                "message", "Too many requests. Please try again later.",
                                "retry_after", retryAfter
                        ))
                        .header("Retry-After", retryAfter)
                        .header("X-RateLimit-Limit", user.getRateLimit())
                        .header("X-RateLimit-Remaining", 0)
                        .header("X-RateLimit-Reset", retryAfter)
                        .build();
            }

            // Check token quota
            long estimatedTokens = estimateTokens(request.fileContent);
            if (!user.hasTokensAvailable(estimatedTokens)) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of(
                                "error", "Token quota exceeded",
                                "tokens_used", user.tokensUsed,
                                "tokens_limit", user.tokensLimit,
                                "tokens_remaining", user.tokensLimit - user.tokensUsed
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

            // Enqueue to Redis for Python worker
            redisService.enqueueJob(jobId, Map.of(
                    "job_id", jobId,
                    "user_id", userId,
                    "type", "review"
            ));

            // Get rate limit info for response headers
            int remainingRequests = redisService.getRemainingRequests(userId, user.getRateLimit());
            long resetAt = redisService.getRateLimitTTL(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("job_id", jobId);
            response.put("status", "queued");
            response.put("message", "Review job created successfully");
            response.put("estimated_tokens", estimatedTokens);

            return Response.ok(response)
                    .header("X-RateLimit-Limit", user.getRateLimit())
                    .header("X-RateLimit-Remaining", remainingRequests)
                    .header("X-RateLimit-Reset", resetAt)
                    .build();

        } catch (Exception e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "Invalid or expired token: " + e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/{jobId}")
    public Response getJobStatus(
            @HeaderParam("Authorization") String authHeader,
            @PathParam("jobId") String jobId
    ) {
        try {
            // Validate JWT
            String userId = jwtService.validateTokenAndGetUserId(authHeader);

            // Find job
            Job job = jobRepository.findByJobId(jobId);

            if (job == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Job not found"))
                        .build();
            }

            // Verify job belongs to user
            if (!job.userId.equals(userId)) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(Map.of("error", "Access denied"))
                        .build();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("job_id", job.jobId);
            response.put("status", job.status);
            response.put("type", job.type);
            response.put("created_at", job.createdAt.toString());

            if (job.results != null) {
                response.put("results", job.results);
            }

            if (job.tokensUsed != null) {
                response.put("tokens_used", job.tokensUsed);
            }

            if (job.errorMessage != null) {
                response.put("error_message", job.errorMessage);
            }

            return Response.ok(response).build();

        } catch (Exception e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "Invalid or expired token"))
                    .build();
        }
    }

    /**
     * Estimate tokens needed for a code review (rough estimate)
     * Claude tokenizer: ~4 chars per token
     */
    private long estimateTokens(String content) {
        // System prompt + input + output buffer
        long inputTokens = content.length() / 4;
        long systemTokens = 500; // System prompt
        long outputTokens = 2000; // Expected output
        return inputTokens + systemTokens + outputTokens;
    }

    public static class ReviewRequest {
        public String filePath;
        public String fileContent;
        public String language;
        public String cursorContext;
    }
}
