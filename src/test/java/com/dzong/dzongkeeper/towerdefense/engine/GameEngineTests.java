package com.dzong.dzongkeeper.towerdefense.engine;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;
import com.dzong.dzongkeeper.towerdefense.model.GamePath;
import com.dzong.dzongkeeper.towerdefense.model.GameState;
import com.dzong.dzongkeeper.towerdefense.model.Projectile;
import com.dzong.dzongkeeper.towerdefense.model.Tower;
import com.dzong.dzongkeeper.towerdefense.structures.Array;
import com.dzong.dzongkeeper.towerdefense.structures.ScoreAvlTree;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GameEngineTests {
    private void advance(GameEngine game, int ticks) {
        for (int i = 0; i < ticks; i++) {
            game.tick();
            assertTrue(game.enemyIndexConsistent());
        }
    }

    @Test
    void pathInterpolatesTurnsAndEnemyCannotBeHitAfterEscape() {
        GamePath path = new GamePath(
                new GamePath.Point(0, 0),
                new GamePath.Point(6, 0),
                new GamePath.Point(6, 4)
        );
        assertEquals(new GamePath.Point(6, 2), path.positionAt(8));
        assertEquals(new GamePath.Point(6, 4), path.positionAt(100));

        Enemy enemy = new Enemy(1, 20, 20, 5, path);
        enemy.move();
        assertTrue(enemy.hasEscaped());
        enemy.takeDamage(100);
        assertEquals(20, enemy.getHealth());

        assertThrows(IllegalArgumentException.class, () -> new GamePath(0));
        assertThrows(IllegalArgumentException.class, () -> new GamePath(-10));
        assertThrows(IllegalArgumentException.class, () -> new Enemy(0, 20, 1, 5, path));
        assertThrows(IllegalArgumentException.class,
                () -> new Enemy(1, 20, Double.NaN, 5, path));
    }

    @Test
    void targetSelectionIncludesBoundaryAndSettlesTiesById() {
        Array<Enemy> enemies = new Array<>();
        Enemy first = new Enemy(2, 20, 1, 5, new GamePath(24));
        Enemy second = new Enemy(1, 20, 1, 5, new GamePath(24));
        enemies.add(first);
        enemies.add(second);

        Tower tower = new Tower(1, 0, 8);
        TargetSelector selector = new TargetSelector();
        assertSame(second, selector.select(tower, enemies));
        second.takeDamage(20);
        assertSame(first, selector.select(tower, enemies));
        first.takeDamage(20);
        assertNull(selector.select(tower, enemies));
    }

    @Test
    void projectilesHitOnlyOnceAndDiscardMissingTargets() {
        Enemy enemy = new Enemy(1, 30, 1, 5, new GamePath(24));
        Projectile shot = new Projectile(new GamePath.Point(0, 0), 1, 20, 4);
        assertTrue(shot.advance(enemy));
        assertEquals(10, enemy.getHealth());
        assertTrue(shot.advance(enemy));
        assertEquals(10, enemy.getHealth());
        assertTrue(new Projectile(new GamePath.Point(0, 0), 1, 20, 4).advance(null));
    }

    @Test
    void buildUpgradeSellValidateBeforeSpending() {
        GameEngine game = new GameEngine();
        assertThrows(IllegalArgumentException.class, () -> game.build(Double.NaN, 2));
        assertThrows(IllegalArgumentException.class, () -> game.build(5, 0));
        assertEquals(120, game.state().gold());

        int id = game.build(5, 3);
        assertThrows(IllegalArgumentException.class, () -> game.build(5, 3));
        game.upgrade(id);
        game.upgrade(id);
        assertEquals(20, game.state().gold());
        assertThrows(IllegalArgumentException.class, () -> game.upgrade(id));
        assertThrows(IllegalArgumentException.class, () -> game.build(10, 5));
        assertEquals(20, game.state().gold());

        game.sell(id);
        assertEquals(70, game.state().gold());
        assertThrows(IllegalArgumentException.class, () -> game.sell(id));
    }

    @Test
    void pauseAndIntermissionFreezeTimeAndSpawnsIncludeTies() {
        GameEngine game = new GameEngine();
        advance(game, 10);
        assertEquals(0, game.state().tick());

        game.startWave();
        assertThrows(IllegalArgumentException.class, game::startWave);
        game.pause(true);
        GameState before = game.state();
        advance(game, 20);
        assertEquals(before, game.state());

        game.pause(false);
        advance(game, 1);
        assertEquals(2, game.state().enemies());
        assertEquals(4, game.state().pendingSpawns());
    }

    @Test
    void wavesConsumeAllOverdueEventsWithUniqueIds() {
        WaveManager waves = new WaveManager();
        waves.schedule(1, 0, new GamePath(24));

        int lastId = 0;
        int count = 0;
        Enemy enemy;
        while ((enemy = waves.spawnDue(100)) != null) {
            assertTrue(enemy.getId() > lastId);
            lastId = enemy.getId();
            count++;
        }
        assertEquals(6, count);
        assertEquals(0, waves.pending());

        waves.schedule(2, 100, new GamePath(24));
        assertTrue(waves.spawnDue(101).getId() > lastId);
    }

    @Test
    void defeatFreezesGameAndSubmitsExactlyOneResult() {
        ScoreAvlTree scores = new ScoreAvlTree();
        GameEngine game = new GameEngine(scores);
        game.startWave();
        advance(game, 200);

        assertTrue(game.state().finished());
        assertFalse(game.state().result().victory());
        assertEquals(0, game.state().lives());
        assertEquals(0, game.state().kills());
        assertEquals(120, game.state().gold());
        assertEquals(1, scores.size());

        GameState before = game.state();
        advance(game, 100);
        assertEquals(before, game.state());
        assertThrows(IllegalArgumentException.class, game::startWave);
    }

    @Test
    void completeGameRewardsOnceAndKeepsResultsAcrossGames() {
        ScoreAvlTree scores = new ScoreAvlTree();
        for (int run = 0; run < 2; run++) {
            GameEngine game = new GameEngine(scores);
            game.build(5, 3);
            game.build(10, 5);
            game.build(15, 9);
            for (int wave = 1; wave <= 3; wave++) {
                game.startWave();
                advance(game, 100);
            }

            GameState state = game.state();
            assertTrue(state.finished());
            assertTrue(state.result().victory());
            assertEquals(3, state.wavesCompleted());
            assertEquals(state.kills() * 12, state.gold());
            assertEquals(
                    state.kills() * 10 + 300 + state.lives() * 20,
                    state.result().score()
            );
            advance(game, 100);
            assertEquals(state, game.state());
        }
        assertEquals(2, scores.size());
        assertNotEquals(scores.top(2).get(0).id(), scores.top(2).get(1).id());
    }
}
