package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.GameResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ScoreAvlTreeTests {
    @Test
    void avlHandlesAllFourRotations() {
        int[][] orders = {
                {30, 20, 10},
                {10, 20, 30},
                {30, 10, 20},
                {10, 30, 20}
        };
        for (int[] order : orders) {
            ScoreAvlTree tree = new ScoreAvlTree();
            for (int score : order) {
                tree.add(new GameResult(score, score, 0, 0, false));
            }
            assertTrue(tree.isBalanced());
            assertEquals(2, tree.height());
            assertEquals(30, tree.top(3).get(0).score());
        }
    }

    @Test
    void avlRetainsTiesRejectsDuplicateIdsAndStaysBalanced() {
        ScoreAvlTree tree = new ScoreAvlTree();
        assertNull(tree.find(0, 1));
        assertEquals(0, tree.top(10).size());

        for (int i = 1; i <= 1000; i++) {
            tree.add(new GameResult(i, i / 3, 0, 0, false));
            assertTrue(tree.isBalanced());
        }
        assertTrue(tree.height() < 15);
        for (int i = 1; i <= 1000; i++) {
            assertEquals(i, tree.find(i / 3, i).id());
        }
        assertNull(tree.find(999, 1));
        assertThrows(IllegalArgumentException.class,
                () -> tree.add(new GameResult(1, 999, 0, 0, false)));

        Array<GameResult> results = tree.top(1000);
        assertEquals(1000, results.size());
        for (int i = 1; i < results.size(); i++) {
            assertTrue(results.get(i - 1).compareTo(results.get(i)) > 0);
        }
        assertEquals(0, tree.top(0).size());
        assertEquals(1001, tree.nextResultId());
    }
}
