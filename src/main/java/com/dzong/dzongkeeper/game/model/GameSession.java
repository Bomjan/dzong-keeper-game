package com.dzong.dzongkeeper.game.model;

import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/** The model for one in-memory investigation. */
public final class GameSession {
    public final ObjectNode state;
    public final ArrayNode register;

    public GameSession(ObjectNode state, ArrayNode register) {
        this.state = state;
        this.register = register;
    }
}
