package com.dzong.dzongkeeper.towerdefense.model;

/** Immutable heap key: due tick followed by sequence, preserving simultaneous spawns. */
public record SpawnEvent(long dueTick, long sequence, GamePath path, int health, double speed, int reward)
        implements Comparable<SpawnEvent> {
    public SpawnEvent {
        if (dueTick < 0 || sequence < 0 || path == null || health <= 0 || speed <= 0 || !Double.isFinite(speed) || reward < 0)
            throw new IllegalArgumentException("Invalid spawn event");
    }
    public int compareTo(SpawnEvent other) {
        int order=Long.compare(dueTick, other.dueTick);
        return order != 0 ? order : Long.compare(sequence, other.sequence);
    }
}
