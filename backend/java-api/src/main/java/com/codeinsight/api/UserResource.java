package com.codeinsight.api;

import com.codeinsight.model.User;
import com.codeinsight.service.UserService;
import com.codeinsight.service.RedisService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.HashMap;
import java.util.Map;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    UserService userService;

    @Inject
    RedisService redisService;

    @GET
    @Path("/whoami")
    public Response whoami(@HeaderParam("Authorization") String authHeader) {
        try {
            // Extract user ID (no validation)
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new Exception("Missing authorization header");
            }
            String userId = authHeader.replace("Bearer ", "").trim();
            String email = "user@example.com"; // Placeholder

            // Get or create user in MongoDB
            User user = userService.getOrCreateUser(userId, email, "lite");

            if (user == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "User not found"))
                        .build();
            }

            // Get rate limit info
            int remainingRequests = redisService.getRemainingRequests(userId, user.getRateLimit());
            long resetAt = redisService.getRateLimitTTL(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("user_id", user.userId);
            response.put("email", user.email);
            response.put("plan", user.plan);
            response.put("api_key", user.apiKey);
            response.put("tokens_used", user.tokensUsed);
            response.put("tokens_limit", user.tokensLimit);
            response.put("tokens_remaining", user.tokensLimit - user.tokensUsed);
            response.put("usage_percentage", String.format("%.2f", (user.tokensUsed * 100.0) / user.tokensLimit));
            response.put("rate_limit", user.getRateLimit());
            response.put("rate_limit_remaining", remainingRequests);
            response.put("rate_limit_reset", resetAt);

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

    @PUT
    @Path("/user/plan")
    public Response updatePlan(
            @HeaderParam("Authorization") String authHeader,
            Map<String, String> body
    ) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new Exception("Missing authorization header");
            }
            String userId = authHeader.replace("Bearer ", "").trim();
            String newPlan = body.get("plan");

            if (newPlan == null || (!newPlan.equals("lite") && !newPlan.equals("pro") && !newPlan.equals("business"))) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Invalid plan. Must be: lite, pro, or business"))
                        .build();
            }

            User user = userService.updateUserPlan(userId, newPlan);

            if (user == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "User not found"))
                        .build();
            }

            return Response.ok(Map.of(
                    "message", "Plan updated successfully",
                    "plan", user.plan,
                    "tokens_limit", user.tokensLimit
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "Invalid or expired token"))
                    .build();
        }
    }
}
