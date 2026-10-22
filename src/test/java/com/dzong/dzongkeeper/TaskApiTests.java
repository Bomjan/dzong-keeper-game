package com.dzong.dzongkeeper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class TaskApiTests {
    @LocalServerPort
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();

    @Test
    void taskLifecycleAndValidation() throws Exception {
        assertEquals(200, send("GET", "/api/health", null).statusCode());
        assertEquals(400, send("POST", "/api/tasks", "{\"title\":\" \"}").statusCode());
        assertEquals(400, send("POST", "/api/tasks", "{").statusCode());
        var created = send("POST", "/api/tasks", "{\"title\":\"First task\"}");
        assertEquals(201, created.statusCode());
        String location = created.headers().firstValue("Location").orElseThrow();
        assertTrue(created.body().contains("First task"));
        assertEquals(200, send("GET", location, null).statusCode());
        assertTrue(send("GET", "/api/tasks", null).body().contains("First task"));
        var updated = send("PUT", location, "{\"title\":\"Done\",\"completed\":true}");
        assertEquals(200, updated.statusCode());
        assertTrue(updated.body().contains("\"completed\":true"));
        assertEquals(204, send("DELETE", location, null).statusCode());
        var missing = send("GET", location, null);
        assertEquals(404, missing.statusCode());
        assertTrue(missing.headers().firstValue("Content-Type").orElse("")
                .contains("application/problem+json"));
        assertEquals(404, send("PUT", location, "{\"title\":\"Missing\"}").statusCode());
        assertEquals(404, send("DELETE", location, null).statusCode());
    }

    private HttpResponse<String> send(String method, String path, String body) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofString(body))
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
