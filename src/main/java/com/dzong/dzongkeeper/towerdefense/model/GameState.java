package com.dzong.dzongkeeper.towerdefense.model;

/** A snapshot of the game; only GameEngine changes the underlying state. */
public record GameState(
        long tick,
        int gold,
        int lives,
        int wave,
        int wavesCompleted,
        int kills,
        int enemies,
        int towers,
        int projectiles,
        int pendingSpawns,
        boolean waveActive,
        boolean paused,
        boolean finished,
        GameResult result
) {
}
