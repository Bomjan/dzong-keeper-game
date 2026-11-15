package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;
import com.dzong.dzongkeeper.towerdefense.model.GamePath;

/** Groups enemies into square cells so a tower checks only nearby cells. */
public final class SpatialHashGrid {
    private static final int BUCKET_COUNT = 64;

    private static final class Cell {
        final int x;
        final int y;
        final Array<Enemy> enemies = new Array<>();
        Cell next;

        Cell(int x, int y, Cell next) {
            this.x = x;
            this.y = y;
            this.next = next;
        }
    }

    private final int cellSize;
    private final Cell[] buckets = new Cell[BUCKET_COUNT];

    public SpatialHashGrid(int cellSize) {
        if (cellSize <= 0) throw new IllegalArgumentException("Cell size must be positive");
        this.cellSize = cellSize;
    }

    public int cellX(double x) { return (int) Math.floor(x / cellSize); }

    public int cellY(double y) { return (int) Math.floor(y / cellSize); }

    private int bucket(int x, int y) {
        return Math.floorMod(31 * x + y, BUCKET_COUNT);
    }

    private Cell findCell(int x, int y) {
        for (Cell cell = buckets[bucket(x, y)]; cell != null; cell = cell.next) {
            if (cell.x == x && cell.y == y) return cell;
        }
        return null;
    }

    public void add(Enemy enemy) {
        int x = cellX(enemy.position().x());
        int y = cellY(enemy.position().y());
        Cell cell = findCell(x, y);
        if (cell == null) {
            int bucket = bucket(x, y);
            cell = new Cell(x, y, buckets[bucket]);
            buckets[bucket] = cell;
        }
        for (int i = 0; i < cell.enemies.size(); i++) {
            if (cell.enemies.get(i) == enemy) return;
        }
        cell.enemies.add(enemy);
    }

    public void update(Enemy enemy, int oldX, int oldY) {
        if (oldX != cellX(enemy.position().x()) || oldY != cellY(enemy.position().y())) {
            removeFromCell(enemy, oldX, oldY);
            add(enemy);
        }
    }

    public void remove(Enemy enemy) {
        removeFromCell(enemy, cellX(enemy.position().x()), cellY(enemy.position().y()));
    }

    private void removeFromCell(Enemy enemy, int x, int y) {
        Cell cell = findCell(x, y);
        if (cell == null) return;
        for (int i = 0; i < cell.enemies.size(); i++) {
            if (cell.enemies.get(i) == enemy) {
                cell.enemies.delete(i);
                return;
            }
        }
    }

    public Array<Enemy> getNearbyEnemies(GamePath.Point position, double range) {
        Array<Enemy> nearby = new Array<>();
        for (int x = cellX(position.x() - range); x <= cellX(position.x() + range); x++) {
            for (int y = cellY(position.y() - range); y <= cellY(position.y() + range); y++) {
                Cell cell = findCell(x, y);
                if (cell == null) continue;
                for (int i = 0; i < cell.enemies.size(); i++) nearby.add(cell.enemies.get(i));
            }
        }
        return nearby;
    }
}
