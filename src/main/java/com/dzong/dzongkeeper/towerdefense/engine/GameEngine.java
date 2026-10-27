package com.dzong.dzongkeeper.towerdefense.engine;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;
import com.dzong.dzongkeeper.towerdefense.model.GamePath;
import com.dzong.dzongkeeper.towerdefense.model.GameResult;
import com.dzong.dzongkeeper.towerdefense.model.GameState;
import com.dzong.dzongkeeper.towerdefense.model.Projectile;
import com.dzong.dzongkeeper.towerdefense.model.Tower;
import com.dzong.dzongkeeper.towerdefense.structures.Array;
import com.dzong.dzongkeeper.towerdefense.structures.EnemyHashTable;
import com.dzong.dzongkeeper.towerdefense.structures.ScoreAvlTree;

/** Deterministic simulation: the game advances only when tick() is called. */
public final class GameEngine {
    private final GamePath path = new GamePath(
            new GamePath.Point(0, 0),
            new GamePath.Point(12, 0),
            new GamePath.Point(12, 12)
    );
    private final Array<Enemy> enemies = new Array<>();
    private final Array<Tower> towers = new Array<>();
    private final Array<Projectile> projectiles = new Array<>();
    private final EnemyHashTable index = new EnemyHashTable();
    private final WaveManager waves = new WaveManager();
    private final TargetSelector selector = new TargetSelector();
    private final ScoreAvlTree leaderboard;

    private long tick;
    private int gold = 120;
    private int lives = 5;
    private int wave;
    private int wavesCompleted;
    private int kills;
    private int nextTowerId = 1;
    private boolean paused;
    private boolean finished;
    private boolean waveActive;
    private GameResult result;

    public GameEngine() {
        this(new ScoreAvlTree());
    }

    public GameEngine(ScoreAvlTree leaderboard) {
        if (leaderboard == null) {
            throw new IllegalArgumentException("Missing leaderboard");
        }
        this.leaderboard = leaderboard;
    }

    public GameState state() {
        return new GameState(
                tick, gold, lives, wave, wavesCompleted, kills,
                enemies.size(), towers.size(), projectiles.size(), waves.pending(),
                waveActive, paused, finished, result
        );
    }

    public int build(double x, double y) {
        ensurePlaying();
        GamePath.Point position = new GamePath.Point(x, y);
        if (x < 0 || x > 20 || y < 0 || y > 20) {
            throw new IllegalArgumentException("Build coordinates must be in [0,20]");
        }
        // The route follows y=0 for x=0..12, then x=12 for y=0..12.
        if ((y == 0 && x <= 12) || (x == 12 && y <= 12)) {
            throw new IllegalArgumentException("Cannot build on the path");
        }
        for (int i = 0; i < towers.size(); i++) {
            if (GamePath.distance(position, towers.get(i).position()) < 1) {
                throw new IllegalArgumentException("Tower positions must be at least one unit apart");
            }
        }

        requireGold(Tower.COST);
        Tower tower = new Tower(nextTowerId++, x, y);
        towers.add(tower);
        gold -= Tower.COST;
        return tower.getId();
    }

    public void upgrade(int id) {
        ensurePlaying();
        Tower tower = tower(id);
        if (tower.getLevel() == Tower.MAX_LEVEL) {
            throw new IllegalArgumentException("Tower already at maximum level");
        }
        requireGold(Tower.UPGRADE_COST);
        tower.upgrade();
        gold -= Tower.UPGRADE_COST;
    }

    public void sell(int id) {
        ensurePlaying();
        Tower tower = tower(id);
        for (int i = 0; i < towers.size(); i++) {
            if (towers.get(i) == tower) {
                gold += tower.refund();
                towers.delete(i);
                return;
            }
        }
    }

    private Tower tower(int id) {
        for (int i = 0; i < towers.size(); i++) {
            Tower tower = towers.get(i);
            if (tower.getId() == id) {
                return tower;
            }
        }
        throw new IllegalArgumentException("Unknown tower ID: " + id);
    }

    private void requireGold(int cost) {
        if (gold < cost) {
            throw new IllegalArgumentException("Not enough gold: need " + cost);
        }
    }

    private void ensurePlaying() {
        if (finished) {
            throw new IllegalArgumentException("Game finished; use new to play again");
        }
    }

    public void pause(boolean value) {
        ensurePlaying();
        paused = value;
    }

    public void startWave() {
        ensurePlaying();
        if (paused || waveActive) {
            throw new IllegalArgumentException("Resume or finish the current wave first");
        }
        waves.schedule(wave + 1, tick, path);
        wave++;
        waveActive = true;
    }

    public void tick() {
        if (paused || finished || !waveActive) {
            return;
        }

        tick++;
        spawnDueEnemies();
        moveEnemies();
        fireReadyTowers();
        advanceProjectiles();
        removeDefeatedOrEscapedEnemies();

        if (lives == 0) {
            finish(false);
        } else if (waves.pending() == 0 && enemies.size() == 0) {
            completeWave();
        }
    }

    private void spawnDueEnemies() {
        Enemy spawned;
        while ((spawned = waves.spawnDue(tick)) != null) {
            index.put(spawned);
            enemies.add(spawned);
        }
    }

    private void moveEnemies() {
        for (int i = 0; i < enemies.size(); i++) {
            enemies.get(i).move();
        }
    }

    private void fireReadyTowers() {
        for (int i = 0; i < towers.size(); i++) {
            Tower tower = towers.get(i);
            if (!tower.ready(tick)) {
                continue;
            }
            Enemy target = selector.select(tower, enemies);
            if (target != null) {
                projectiles.add(new Projectile(tower.position(), target.getId(), tower.damage(), 4));
                tower.fired(tick);
            }
        }
    }

    private void advanceProjectiles() {
        for (int i = projectiles.size() - 1; i >= 0; i--) {
            Projectile shot = projectiles.get(i);
            if (shot.advance(index.get(shot.targetId()))) {
                projectiles.delete(i);
            }
        }
    }

    private void removeDefeatedOrEscapedEnemies() {
        for (int i = enemies.size() - 1; i >= 0; i--) {
            Enemy enemy = enemies.get(i);
            if (enemy.isAlive() && !enemy.hasEscaped()) {
                continue;
            }

            if (!enemy.isAlive()) {
                kills++;
                gold += enemy.getGoldReward();
            } else {
                lives = Math.max(0, lives - 1);
            }
            index.remove(enemy.getId());
            enemies.delete(i);
        }
    }

    private void completeWave() {
        wavesCompleted++;
        waveActive = false;
        while (projectiles.size() > 0) {
            projectiles.delete();
        }
        if (wave == WaveManager.TOTAL_WAVES) {
            finish(true);
        }
    }

    private void finish(boolean victory) {
        finished = true;
        waveActive = false;
        int score = kills * 10 + wavesCompleted * 100 + lives * 20;
        result = new GameResult(leaderboard.nextResultId(), score, wavesCompleted, lives, victory);
        leaderboard.add(result);
    }

    public boolean enemyIndexConsistent() {
        if (index.size() != enemies.size()) {
            return false;
        }
        for (int i = 0; i < enemies.size(); i++) {
            Enemy enemy = enemies.get(i);
            if (index.get(enemy.getId()) != enemy) {
                return false;
            }
        }
        return true;
    }

    public String details() {
        StringBuilder out = new StringBuilder("Route: (0,0) -> (12,0) -> Dzong (12,12)\n");
        for (int i = 0; i < towers.size(); i++) {
            Tower tower = towers.get(i);
            out.append("Tower #").append(tower.getId())
                    .append(" at ").append(tower.position())
                    .append(" level ").append(tower.getLevel())
                    .append('\n');
        }
        for (int i = 0; i < enemies.size(); i++) {
            Enemy enemy = enemies.get(i);
            out.append("Enemy #").append(enemy.getId())
                    .append(" HP ").append(enemy.getHealth())
                    .append(" at ").append(enemy.position())
                    .append('\n');
        }
        return out.toString();
    }
}
