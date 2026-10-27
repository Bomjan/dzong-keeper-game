package com.dzong.dzongkeeper.towerdefense.engine;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;
import com.dzong.dzongkeeper.towerdefense.model.GamePath;
import com.dzong.dzongkeeper.towerdefense.model.SpawnEvent;
import com.dzong.dzongkeeper.towerdefense.structures.SpawnMinHeap;

public final class WaveManager {
    public static final int TOTAL_WAVES = 3;

    private final SpawnMinHeap pending = new SpawnMinHeap();
    private long sequence;
    private int lastWave;
    private int nextEnemyId = 1;

    public int pending() {
        return pending.size();
    }

    public void schedule(int wave, long tick, GamePath path) {
        if (wave != lastWave + 1 || wave > TOTAL_WAVES
                || tick < 0 || path == null || pending() > 0) {
            throw new IllegalArgumentException("Wave cannot be scheduled");
        }

        int enemyCount = 4 + wave * 2;
        int health = 16 + wave * 8;
        double speed = 0.7 + wave * 0.1;
        for (int i = 0; i < enemyCount; i++) {
            long dueTick = tick + 1 + (i / 2) * 3;
            pending.add(new SpawnEvent(dueTick, sequence++, path, health, speed, 12));
        }
        lastWave = wave;
    }

    public Enemy spawnDue(long tick) {
        SpawnEvent next = pending.peek();
        if (next == null || next.dueTick() > tick) {
            return null;
        }

        SpawnEvent event = pending.poll();
        return new Enemy(
                nextEnemyId++,
                event.health(),
                event.speed(),
                event.reward(),
                event.path()
        );
    }
}
