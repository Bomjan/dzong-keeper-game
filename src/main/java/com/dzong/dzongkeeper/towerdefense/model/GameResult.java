package com.dzong.dzongkeeper.towerdefense.model;

public record GameResult(
        long id,
        int score,
        int wavesCompleted,
        int lives,
        boolean victory
) implements Comparable<GameResult> {
    public GameResult {
        if (id <= 0 || score < 0 || wavesCompleted < 0 || lives < 0) {
            throw new IllegalArgumentException("Invalid result");
        }
    }

    @Override
    public int compareTo(GameResult other) {
        int order = Integer.compare(score, other.score);
        return order != 0 ? order : Long.compare(id, other.id);
    }
}
