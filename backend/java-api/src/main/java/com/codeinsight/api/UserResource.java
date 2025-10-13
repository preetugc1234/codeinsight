package com.codeinsight.api;

import com.codeinsight.model.User;
import com.codeinsight.repository.UserRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    UserRepository userRepository;

    @GET
    @Path("/whoami")
    public Response whoami(@HeaderParam("Authorization") String authHeader) {
        String userId = extractUserId(authHeader);

        if (userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("error", "Invalid or missing authorization"))
                    .build();
        }

        Optional<User> userOpt = userRepository.findBySupabaseId(userId);

        if (userOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "User not found"))
                    .build();
        }

        User user = userOpt.get();

        Map<String, Object> response = new HashMap<>();
        response.put("user_id", user.supabaseId);
        response.put("email", user.email);
        response.put("plan", user.plan);
        response.put("tokens_used", user.tokensUsed);
        response.put("tokens_limit", user.tokensLimit);
        response.put("tokens_remaining", user.tokensLimit - user.tokensUsed);
        response.put("usage_percentage", (user.tokensUsed * 100.0) / user.tokensLimit);

        return Response.ok(response).build();
    }

    private String extractUserId(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return "demo-user-id";
        }
        return null;
    }
}
