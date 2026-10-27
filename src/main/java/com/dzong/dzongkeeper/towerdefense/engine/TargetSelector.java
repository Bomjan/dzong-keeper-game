package com.dzong.dzongkeeper.towerdefense.engine;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;
import com.dzong.dzongkeeper.towerdefense.model.GamePath;
import com.dzong.dzongkeeper.towerdefense.model.Tower;
import com.dzong.dzongkeeper.towerdefense.structures.Array;

/** Chooses the nearest enemy in range; ties go to the smaller enemy ID. */
public final class TargetSelector {
    public Enemy select(Tower tower, Array<Enemy> enemies) {
        Enemy closest = null;
        double closestDistance = tower.range();

        for (int i = 0; i < enemies.size(); i++) {
            Enemy enemy = enemies.get(i);
            if (!enemy.isTargetable()) {
                continue;
            }

            double distance = GamePath.distance(tower.position(), enemy.position());
            if (distance < closestDistance
                    || (Double.compare(distance, closestDistance) == 0
                    && (closest == null || enemy.getId() < closest.getId()))) {
                closest = enemy;
                closestDistance = distance;
            }
        }
        return closest;
    }
}
