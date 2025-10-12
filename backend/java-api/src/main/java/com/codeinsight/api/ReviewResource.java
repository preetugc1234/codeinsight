package com.codeinsight.api;

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

    @POST
    public Response createReview(Map<String, Object> request) {
        // TODO: Implement JWT validation
        // TODO: Check user quotas (Redis)
        // TODO: Enqueue job to Redis Streams

        String jobId = UUID.randomUUID().toString();

        Map<String, Object> response = new HashMap<>();
        response.put("job_id", jobId);
        response.put("status", "queued");
        response.put("message", "Review job created successfully");

        return Response.ok(response).build();
    }

    @GET
    @Path("/{jobId}")
    public Response getJobStatus(@PathParam("jobId") String jobId) {
        // TODO: Fetch job status from MongoDB or Redis

        Map<String, Object> response = new HashMap<>();
        response.put("job_id", jobId);
        response.put("status", "processing");
        response.put("progress", 45);

        return Response.ok(response).build();
    }
}
