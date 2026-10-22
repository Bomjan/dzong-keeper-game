package com.dzong.dzongkeeper.game.service;

import com.dzong.dzongkeeper.game.model.Accusation;
import com.dzong.dzongkeeper.game.model.GameSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@Service
public class GameService {
    private final ObjectMapper mapper;
    private GameSession session;

    public GameService(ObjectMapper mapper) {
        this.mapper = mapper;
        reset();
    }

    public synchronized ObjectNode reset() {
        try (var input = new ClassPathResource("static/data/state.json").getInputStream()) {
            JsonNode data = mapper.readTree(input);
            session = new GameSession((ObjectNode) data.get("state"), (ArrayNode) data.get("registerLedger"));
            return state();
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load the game data", exception);
        }
    }

    public synchronized ObjectNode state() {
        if ("LOST".equals(session.state.path("phase").asText())) {
            session.state.put("message", "Time has run out. The intruder escaped.");
        }
        return session.state.deepCopy();
    }

    public synchronized List<JsonNode> searchRegister(String query) {
        String search = query == null ? "" : query.strip().toLowerCase(Locale.ROOT);
        List<JsonNode> results = new ArrayList<>();
        for (JsonNode entry : session.register) {
            if (entry.path("itemName").asText().toLowerCase(Locale.ROOT).contains(search)
                    || entry.path("category").asText().toLowerCase(Locale.ROOT).contains(search)) {
                results.add(entry.deepCopy());
            }
        }
        return results;
    }

    public synchronized ObjectNode move(String roomId) {
        requirePlaying();
        ObjectNode room = find(session.state.withArray("rooms"), roomId);
        String current = session.state.path("currentRoom").asText();
        ObjectNode connecting = null;
        for (JsonNode candidate : session.state.withArray("edges")) {
            boolean connected = (candidate.path("from").asText().equals(current) && candidate.path("to").asText().equals(roomId))
                    || (candidate.path("to").asText().equals(current) && candidate.path("from").asText().equals(roomId));
            if (connected && !candidate.path("locked").asBoolean()) {
                connecting = (ObjectNode) candidate;
                break;
            }
        }
        if (connecting == null) throw badRequest("That room is not reachable from here");
        spend(connecting.path("cost").asInt());
        session.state.put("currentRoom", roomId);
        room.put("visited", true);
        refreshAdjacent();
        session.state.put("message", "You walk to the " + room.path("name").asText() + ".");
        return state();
    }

    public synchronized ObjectNode inspect() {
        requirePlaying();
        spend(5);
        ObjectNode room = find(session.state.withArray("rooms"), session.state.path("currentRoom").asText());
        if (room.path("lastInspectedAt").isNull()) {
            room.put("lastInspectedAt", session.state.path("timeTotal").asInt() - session.state.path("timeRemaining").asInt());
            room.put("anomalyCount", room.path("anomalyCount").asInt() + 1);
            ObjectNode finding = session.state.withArray("findings").addObject();
            finding.put("id", "f_inspect_" + room.path("id").asText());
            finding.put("type", "MOVED");
            finding.put("roomId", room.path("id").asText());
            finding.put("itemName", "Signs of recent activity");
            finding.put("estimatedTime", session.state.path("timeTotal").asInt() - session.state.path("timeRemaining").asInt());
            finding.put("note", "Something in the " + room.path("name").asText() + " was disturbed recently.");
            session.state.put("message", "You found signs of recent activity in the " + room.path("name").asText() + ".");
        } else {
            session.state.put("message", "You find nothing new in the " + room.path("name").asText() + ".");
        }
        return state();
    }

    public synchronized ObjectNode interview(String witnessId) {
        requirePlaying();
        ObjectNode witness = find(session.state.withArray("witnesses"), witnessId);
        if (!witness.path("roomId").asText().equals(session.state.path("currentRoom").asText())) {
            throw badRequest("You must be in the witness's room");
        }
        if (witness.path("interviewed").asBoolean()) throw badRequest("You already interviewed this witness");
        spend(10);
        witness.put("interviewed", true);
        String name = witness.path("name").asText();
        String clueText = switch (witnessId) {
            case "w_01" -> "Kinley saw the night watchman near the eastern courtyard after the procession.";
            case "w_02" -> "Pemba noticed that the watch bell was missing from its usual place.";
            default -> name + " recalls an unfamiliar figure near the stores.";
        };
        ObjectNode clue = session.state.withArray("clues").addObject();
        clue.put("id", "c_" + witnessId);
        clue.put("text", clueText);
        clue.put("reliability", 0.8);
        clue.put("source", name);
        session.state.put("message", name + " tells you what they saw.");
        return state();
    }

    public synchronized ObjectNode toggleEdge(String edgeId) {
        requirePlaying();
        ObjectNode edge = find(session.state.withArray("edges"), edgeId);
        spend(2);
        boolean locked = !edge.path("locked").asBoolean();
        edge.put("locked", locked);
        refreshAdjacent();
        session.state.put("message", locked ? "The corridor is locked." : "The corridor is open again.");
        return state();
    }

    public synchronized Accusation accuse(String suspectId) {
        requirePlaying();
        ObjectNode suspect = find(session.state.withArray("suspects"), suspectId);
        if (suspect.path("eliminated").asBoolean()) throw badRequest("That suspect has already been cleared");
        if ("s_03".equals(suspectId)) {
            String message = "The night watchman is caught. The dzong is secure.";
            session.state.put("phase", "WON");
            session.state.put("message", message);
            return new Accusation(true, message);
        }
        spend(30);
        suspect.put("eliminated", true);
        String message = suspect.path("label").asText() + " is cleared. Time is running out.";
        session.state.put("message", message);
        return new Accusation(false, message);
    }

    private void requirePlaying() {
        if (!"FORENSIC".equals(session.state.path("phase").asText())) {
            throw badRequest("The investigation has ended");
        }
    }

    private void spend(int cost) {
        int remaining = session.state.path("timeRemaining").asInt();
        if (remaining < cost) throw badRequest("Not enough time remains");
        session.state.put("timeRemaining", remaining - cost);
        if (remaining == cost) {
            session.state.put("phase", "LOST");
            session.state.put("message", "Time has run out. The intruder escaped.");
        }
    }

    private void refreshAdjacent() {
        String current = session.state.path("currentRoom").asText();
        ArrayNode adjacent = mapper.createArrayNode();
        for (JsonNode edge : session.state.withArray("edges")) {
            if (edge.path("locked").asBoolean()) continue;
            if (edge.path("from").asText().equals(current)) adjacent.add(edge.path("to").asText());
            if (edge.path("to").asText().equals(current)) adjacent.add(edge.path("from").asText());
        }
        session.state.set("adjacent", adjacent);
    }

    private ObjectNode find(ArrayNode nodes, String id) {
        for (JsonNode node : nodes) {
            if (node.path("id").asText().equals(id)) return (ObjectNode) node;
        }
        throw badRequest("Unknown game target: " + id);
    }

    private ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
