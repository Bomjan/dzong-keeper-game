package com.dzong.dzongkeeper.towerdefense.model;

/** Scalar snapshot; mutation belongs to GameEngine. */
public record GameState(long tick, int gold, int lives, int wave, int wavesCompleted,
        int kills, int enemies, int towers, int projectiles, int pendingSpawns,
        boolean waveActive, boolean paused, boolean finished, GameResult result) { }
