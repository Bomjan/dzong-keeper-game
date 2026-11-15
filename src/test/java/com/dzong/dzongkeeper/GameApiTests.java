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
        assertTrue(send("GET", "/investigation.html").body().contains("Plan a route"));
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

    @Test
    void travelUsesCheapestUnlockedRouteWithoutChangingOneStepMovement() throws Exception {
        send("POST", "/api/game/reset");
        assertEquals(400, send("POST", "/api/game/move/r_admin").statusCode());
        assertEquals(400, send("POST", "/api/game/travel/r_missing").statusCode());
        assertEquals(400, send("POST", "/api/game/travel/r_utse").statusCode());
        var preview = mapper.readTree(send("GET", "/api/game/route/r_admin").body());
        assertTrue(preview.path("reachable").asBoolean());
        assertEquals(6, preview.path("cost").asInt());
        assertEquals("r_utse", preview.path("rooms").get(0).asText());
        assertEquals("r_court_w", preview.path("rooms").get(1).asText());
        assertEquals("r_admin", preview.path("rooms").get(2).asText());
        var afterPreview = mapper.readTree(send("GET", "/api/game").body());
        assertEquals(460, afterPreview.path("timeRemaining").asInt());
        assertEquals("r_utse", afterPreview.path("currentRoom").asText());
        assertEquals(400, send("GET", "/api/game/route/r_missing").statusCode());
        var traveled = mapper.readTree(send("POST", "/api/game/travel/r_admin").body());
        assertEquals("r_admin", traveled.path("currentRoom").asText());
        assertEquals(454, traveled.path("timeRemaining").asInt());
        assertTrue(traveled.path("rooms").get(1).path("visited").asBoolean());
        assertTrue(traveled.path("rooms").get(7).path("visited").asBoolean());

        send("POST", "/api/game/reset");
        send("POST", "/api/game/edges/e_09/toggle");
        var blocked = mapper.readTree(send("GET", "/api/game/route/r_watchtower").body());
        assertFalse(blocked.path("reachable").asBoolean());
        assertEquals(-1, blocked.path("cost").asInt());
        assertEquals(400, send("POST", "/api/game/travel/r_watchtower").statusCode());
        var state = mapper.readTree(send("GET", "/api/game").body());
        assertEquals("r_utse", state.path("currentRoom").asText());
        assertEquals(458, state.path("timeRemaining").asInt());
        send("POST", "/api/game/edges/e_09/toggle");
        assertTrue(mapper.readTree(send("GET", "/api/game/route/r_watchtower").body())
                .path("reachable").asBoolean());
        var reopened = mapper.readTree(send("POST", "/api/game/travel/r_watchtower").body());
        assertEquals("r_watchtower", reopened.path("currentRoom").asText());
        assertEquals(451, reopened.path("timeRemaining").asInt());
    }

    private HttpResponse<String> send(String method, String path) throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .method(method, HttpRequest.BodyPublishers.noBody()).build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
