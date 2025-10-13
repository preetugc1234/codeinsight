package com.codeinsight.service;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.UrlJwkProvider;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;

@ApplicationScoped
public class JWTService {

    @ConfigProperty(name = "supabase.url")
    String supabaseUrl;

    @ConfigProperty(name = "supabase.jwt.issuer", defaultValue = "https://cblgjjbpfpimrrpjlkhp.supabase.co/auth/v1")
    String jwtIssuer;

    private JwkProvider jwkProvider;

    public JWTService() {
        // JwkProvider will be initialized on first use
    }

    private JwkProvider getJwkProvider() {
        if (jwkProvider == null) {
            try {
                // Supabase JWKS endpoint
                String jwksUrl = jwtIssuer.replace("/auth/v1", "") + "/.well-known/jwks.json";
                jwkProvider = new UrlJwkProvider(new URL(jwksUrl));
            } catch (Exception e) {
                throw new RuntimeException("Failed to initialize JwkProvider", e);
            }
        }
        return jwkProvider;
    }

    /**
     * Validate JWT token from Supabase and extract user ID
     * @param token Bearer token from Authorization header
     * @return User ID (sub claim) from the token
     * @throws Exception if token is invalid
     */
    public String validateTokenAndGetUserId(String token) throws Exception {
        // Remove "Bearer " prefix if present
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        // Decode JWT to get the key ID
        DecodedJWT jwt = JWT.decode(token);

        // Get the public key from Supabase JWKS
        Jwk jwk = getJwkProvider().get(jwt.getKeyId());
        RSAPublicKey publicKey = (RSAPublicKey) jwk.getPublicKey();

        // Verify the token signature
        Algorithm algorithm = Algorithm.RSA256(publicKey, null);
        algorithm.verify(jwt);

        // Verify issuer
        if (!jwtIssuer.equals(jwt.getIssuer())) {
            throw new Exception("Invalid token issuer");
        }

        // Verify expiration
        if (jwt.getExpiresAt().getTime() < System.currentTimeMillis()) {
            throw new Exception("Token expired");
        }

        // Extract user ID (sub claim)
        String userId = jwt.getSubject();
        if (userId == null || userId.isEmpty()) {
            throw new Exception("Invalid token: missing user ID");
        }

        return userId;
    }

    /**
     * Extract email from JWT token
     */
    public String extractEmail(String token) throws Exception {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        DecodedJWT jwt = JWT.decode(token);
        return jwt.getClaim("email").asString();
    }

    /**
     * Validate token and return full decoded JWT
     */
    public DecodedJWT validateAndDecodeToken(String token) throws Exception {
        validateTokenAndGetUserId(token); // This validates the token
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return JWT.decode(token);
    }
}
