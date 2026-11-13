package com.modernsalon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class GeminiAiService {

    @Value("${salon.gemini.api-key:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private static final List<String> FALLBACK_MODELS = Arrays.asList(
            "gemini-2.5-flash",
            "gemini-flash-latest"
    );

    public Optional<String> generateContent(String prompt, String systemInstruction, boolean jsonResponse) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return Optional.empty();
        }
        for (String model : FALLBACK_MODELS) {
            try {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
                if (systemInstruction != null && !systemInstruction.isBlank()) {
                    body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))));
                }
                if (jsonResponse) {
                    body.put("generationConfig", Map.of("responseMimeType", "application/json"));
                }

                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(20))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    JsonNode root = objectMapper.readTree(response.body());
                    String text = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText("");
                    if (!text.isBlank()) {
                        return Optional.of(text);
                    }
                }
            } catch (Exception ignored) {
                // Try next model fallback
            }
        }
        return Optional.empty();
    }
}
