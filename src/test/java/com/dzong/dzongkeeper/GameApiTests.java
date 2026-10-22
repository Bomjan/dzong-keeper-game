package com.dzong.dzongkeeper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GameApiTests {
    @LocalServerPort
    private int port;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void servesViewAndRunsGameActions() throws Exception {
        assertTrue(send("GET", "/").body().contains("The Last Dzong Keeper"));
        assertTrue(send("GET", "/js/api.js").body().contains("/api/game"));
        send("POST", "/api/game/reset");
        assertEquals("r_utse", mapper.readTree(send("GET", "/api/game").body()).path("currentRoom").asText());
        assertEquals(400, send("POST", "/api/game/move/r_watchtower").statusCode());
        var moved = mapper.readTree(send("POST", "/api/game/move/r_court_e").body());
        assertEquals("r_court_e", moved.path("currentRoom").asText());
        assertEquals(456, moved.path("timeRemaining").asInt());
        assertEquals(400, send("POST", "/api/game/interview/w_02").statusCode());
        var interviewed = mapper.readTree(send("POST", "/api/game/interview/w_01").body());
        assertEquals(2, interviewed.path("clues").size());
        assertEquals(400, send("POST", "/api/game/interview/w_01").statusCode());
        assertTrue(mapper.readTree(send("GET", "/api/game/register?q=mask").body()).size() > 0);
        var locked = mapper.readTree(send("POST", "/api/game/edges/e_04/toggle").body());
        assertTrue(locked.path("edges").get(3).path("locked").asBoolean());
        assertEquals(400, send("POST", "/api/game/move/r_utse").statusCode());
        assertFalse(mapper.readTree(send("POST", "/api/game/accuse/s_01").body()).path("correct").asBoolean());
        assertTrue(mapper.readTree(send("POST", "/api/game/accuse/s_03").body()).path("correct").asBoolean());
        assertEquals("WON", mapper.readTree(send("GET", "/api/game").body()).path("phase").asText());
        assertEquals(400, send("POST", "/api/game/inspect").statusCode());
    }

    private HttpResponse<String> send(String method, String path) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .method(method, HttpRequest.BodyPublishers.noBody()).build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
