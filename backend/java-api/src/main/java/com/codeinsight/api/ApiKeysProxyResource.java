package com.codeinsight.api;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Proxy for /api/keys/* and /api/auth/* endpoints
 * Forwards requests to Python worker for API key management and authentication
 *
 * @PermitAll allows these endpoints to bypass JWT validation
 * The Python worker will handle authentication
 */
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
public class ApiKeysProxyResource {

    @ConfigProperty(name = "app.python-worker.url")
    String pythonWorkerUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Generate new API key
     * POST /api/keys/generate
     */
    @POST
    @Path("/keys/generate")
    public Response generateApiKey(@HeaderParam("Authorization") String authHeader) {
        return proxyToPython("/api/keys/generate", "POST", authHeader, null);
    }

    /**
     * Validate API key
     * POST /api/keys/validate
     */
    @POST
    @Path("/keys/validate")
    public Response validateApiKey(@HeaderParam("Authorization") String authHeader, String body) {
        return proxyToPython("/api/keys/validate", "POST", authHeader, body);
    }

    /**
     * Get API key info
     * GET /api/keys/info
     */
    @GET
    @Path("/keys/info")
    public Response getApiKeyInfo(@HeaderParam("Authorization") String authHeader) {
        return proxyToPython("/api/keys/info", "GET", authHeader, null);
    }

    /**
     * Revoke API key
     * POST /api/keys/revoke
     */
    @POST
    @Path("/keys/revoke")
    public Response revokeApiKey(@HeaderParam("Authorization") String authHeader) {
        return proxyToPython("/api/keys/revoke", "POST", authHeader, null);
    }

    /**
     * WHO AM I - Authentication validation
     * GET /api/auth/whoami
     */
    @GET
    @Path("/auth/whoami")
    public Response whoami(@HeaderParam("Authorization") String authHeader) {
        return proxyToPython("/api/auth/whoami", "GET", authHeader, null);
    }

    /**
     * Validate key endpoint
     * POST /api/auth/validate-key
     */
    @POST
    @Path("/auth/validate-key")
    public Response validateKey(@HeaderParam("Authorization") String authHeader) {
        return proxyToPython("/api/auth/validate-key", "POST", authHeader, null);
    }

    /**
     * Proxy requests to Python worker
     */
    private Response proxyToPython(String path, String method, String authHeader, String body) {
        try {
            String url = pythonWorkerUrl + path;

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30));

            // Add authorization header
            if (authHeader != null && !authHeader.isEmpty()) {
                requestBuilder.header("Authorization", authHeader);
            }

            // Add content type for POST requests
            if ("POST".equals(method)) {
                requestBuilder.header("Content-Type", "application/json");
                if (body != null && !body.isEmpty()) {
                    requestBuilder.POST(HttpRequest.BodyPublishers.ofString(body));
                } else {
                    requestBuilder.POST(HttpRequest.BodyPublishers.noBody());
                }
            } else {
                requestBuilder.GET();
            }

            HttpRequest request = requestBuilder.build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            return Response
                    .status(response.statusCode())
                    .entity(response.body())
                    .build();

        } catch (Exception e) {
            System.err.println("❌ Error proxying to Python worker: " + e.getMessage());
            e.printStackTrace();

            return Response
                    .status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity("{\"error\": \"Failed to connect to authentication service\", \"message\": \"" + e.getMessage() + "\"}")
                    .build();
        }
    }
}
