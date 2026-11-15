package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.engine.TargetSelector;
import com.dzong.dzongkeeper.towerdefense.model.Enemy;
import com.dzong.dzongkeeper.towerdefense.model.GamePath;
import com.dzong.dzongkeeper.towerdefense.model.Tower;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SpatialHashGridTests {
    @Test
    void assignsUpdatesAndRemovesEnemiesAtCellBoundaries() {
        SpatialHashGrid grid = new SpatialHashGrid(4);
        assertEquals(-1, grid.cellX(-0.1));
        assertEquals(1, grid.cellX(4));
        GamePath path = new GamePath(new GamePath.Point(3, 0), new GamePath.Point(9, 0));
        Enemy first = new Enemy(1, 10, 1, 1, path);
        Enemy second = new Enemy(2, 10, 1, 1, path);
        grid.add(first);
        grid.add(first);
        grid.add(second);
        assertEquals(2, grid.getNearbyEnemies(new GamePath.Point(3, 0), 0).size());
        int oldX = grid.cellX(first.position().x());
        int oldY = grid.cellY(first.position().y());
        first.move();
        grid.update(first, oldX, oldY);
        assertEquals(1, grid.getNearbyEnemies(new GamePath.Point(3, 0), 0).size());
        assertEquals(1, grid.getNearbyEnemies(new GamePath.Point(4, 0), 0).size());
        grid.remove(first);
        assertEquals(0, grid.getNearbyEnemies(new GamePath.Point(4, 0), 0).size());
    }

    @Test
    void gridAndLinearSelectionChooseTheSameEnemy() {
        GamePath path = new GamePath(24);
        Array<Enemy> enemies = new Array<>();
        SpatialHashGrid grid = new SpatialHashGrid(4);
        for (int i = 1; i <= 20; i++) {
            Enemy enemy = new Enemy(i, 10, i, 1, path);
            enemy.move();
            enemies.add(enemy);
            grid.add(enemy);
        }
        TargetSelector selector = new TargetSelector();
        for (int x = 0; x <= 20; x++) {
            Tower tower = new Tower(1, x, 2);
            assertSame(selector.select(tower, enemies), selector.select(tower, grid));
        }
    }
}
