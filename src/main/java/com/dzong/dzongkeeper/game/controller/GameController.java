package com.dzong.dzongkeeper.game.controller;

import com.dzong.dzongkeeper.game.model.Accusation;
import com.dzong.dzongkeeper.game.service.GameService;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

@RestController
@RequestMapping("/api/game")
public class GameController {
    private final GameService service;

    public GameController(GameService service) {
        this.service = service;
    }

    @GetMapping
    public ObjectNode state() { return service.state(); }

    @GetMapping("/register")
    public List<JsonNode> register(@RequestParam(defaultValue = "") String q) { return service.searchRegister(q); }

    @PostMapping("/reset")
    public ObjectNode reset() { return service.reset(); }

    @PostMapping("/move/{roomId}")
    public ObjectNode move(@PathVariable String roomId) { return service.move(roomId); }

    @PostMapping("/inspect")
    public ObjectNode inspect() { return service.inspect(); }

    @PostMapping("/interview/{witnessId}")
    public ObjectNode interview(@PathVariable String witnessId) { return service.interview(witnessId); }

    @PostMapping("/edges/{edgeId}/toggle")
    public ObjectNode toggleEdge(@PathVariable String edgeId) { return service.toggleEdge(edgeId); }

    @PostMapping("/accuse/{suspectId}")
    public Accusation accuse(@PathVariable String suspectId) { return service.accuse(suspectId); }
}
