package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;
import com.dzong.dzongkeeper.towerdefense.model.GamePath;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EnemyHashTableTests {
    private Enemy enemy(int id) {
        return new Enemy(id, 24, 1, 12, new GamePath(24));
    }

    @Test
    void hashCollisionsRemovalAndRehashPreserveEveryEntry() {
        EnemyHashTable table = new EnemyHashTable();
        table.put(enemy(1));
        table.put(enemy(5));
        table.put(enemy(9));

        assertEquals(5, table.remove(5).getId()); // Middle of a collision chain.
        assertEquals(9, table.remove(9).getId()); // Head of a collision chain.
        assertEquals(1, table.get(1).getId());
        assertThrows(IllegalArgumentException.class, () -> table.put(enemy(1)));

        table.remove(1);
        for (int i = 1; i <= 500; i++) {
            table.put(enemy(i));
        }
        for (int i = 1; i <= 500; i++) {
            assertEquals(i, table.get(i).getId());
        }
        for (int i = 1; i <= 500; i += 2) {
            assertNotNull(table.remove(i));
        }
        for (int i = 1; i <= 500; i++) {
            assertEquals(i % 2 == 0, table.get(i) != null);
        }
        assertEquals(250, table.size());
        assertNull(table.remove(-1));
        assertNull(table.get(0));
    }
}
