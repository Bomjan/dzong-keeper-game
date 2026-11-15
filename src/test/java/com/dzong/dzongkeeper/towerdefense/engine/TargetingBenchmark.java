package com.dzong.dzongkeeper.towerdefense.engine;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;
import com.dzong.dzongkeeper.towerdefense.model.GamePath;
import com.dzong.dzongkeeper.towerdefense.model.Tower;
import com.dzong.dzongkeeper.towerdefense.structures.Array;
import com.dzong.dzongkeeper.towerdefense.structures.SpatialHashGrid;

/** Run manually to compare the two targeting methods on the same enemies. */
public final class TargetingBenchmark {
    private static volatile int checksum;

    public static void main(String[] args) {
        for (int enemyCount : new int[] {10, 100, 1000}) {
            for (int towerCount : new int[] {1, 10}) {
                compare(enemyCount, towerCount);
            }
        }
    }

    private static void compare(int enemyCount, int towerCount) {
        Array<Enemy> enemies = new Array<>();
        SpatialHashGrid grid = new SpatialHashGrid(4);
        GamePath path = new GamePath(1000);
        for (int i = 0; i < enemyCount; i++) {
            Enemy enemy = new Enemy(i + 1, 10, 1 + (i % 900), 1, path);
            enemy.move();
            enemies.add(enemy);
            grid.add(enemy);
        }
        Tower[] towers = new Tower[towerCount];
        for (int i = 0; i < towerCount; i++) towers[i] = new Tower(i + 1, i * 90, 2);
        TargetSelector selector = new TargetSelector();
        int linearDistances = 0;
        int gridDistances = 0;
        for (Tower tower : towers) {
            linearDistances += enemies.size();
            gridDistances += grid.getNearbyEnemies(tower.position(), tower.range()).size();
            if (selector.select(tower, enemies) != selector.select(tower, grid)) {
                throw new AssertionError("Target mismatch");
            }
        }
        // Warm up both paths before recording elapsed time.
        for (int i = 0; i < 2000; i++) runSelections(selector, towers, enemies, grid, i % 2 == 0);
        long linear = measure(selector, towers, enemies, grid, false);
        long spatial = measure(selector, towers, enemies, grid, true);
        System.out.printf("enemies=%d towers=%d linear=%d ns grid=%d ns distances=%d/%d identical=yes%n",
                enemyCount, towerCount, linear, spatial, linearDistances, gridDistances);
    }

    private static long measure(TargetSelector selector, Tower[] towers, Array<Enemy> enemies,
                                SpatialHashGrid grid, boolean spatial) {
        long start = System.nanoTime();
        for (int i = 0; i < 2000; i++) runSelections(selector, towers, enemies, grid, spatial);
        return System.nanoTime() - start;
    }

    private static void runSelections(TargetSelector selector, Tower[] towers, Array<Enemy> enemies,
                                      SpatialHashGrid grid, boolean spatial) {
        for (Tower tower : towers) {
            Enemy target = spatial ? selector.select(tower, grid) : selector.select(tower, enemies);
            checksum += target == null ? 0 : target.getId();
        }
    }
}
