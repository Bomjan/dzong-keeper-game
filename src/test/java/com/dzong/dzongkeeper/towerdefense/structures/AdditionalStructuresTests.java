package com.dzong.dzongkeeper.towerdefense.structures;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AdditionalStructuresTests {
    @Test
    void queuePreservesFifoAcrossWraparoundGrowthAndShrink() {
        CircularQueue<Integer> queue = new CircularQueue<>();
        assertNull(queue.poll());
        for (int i = 0; i < 4; i++) queue.add(i);
        assertEquals(0, queue.poll());
        assertEquals(1, queue.poll());
        for (int i = 4; i < 40; i++) queue.add(i);
        for (int i = 2; i < 40; i++) {
            assertEquals(i, queue.peek());
            assertEquals(i, queue.poll());
        }
        assertEquals(0, queue.size());
        queue.add(99);
        assertEquals(99, queue.poll());
        assertThrows(IllegalArgumentException.class, () -> queue.add(null));
    }

    @Test
    void stackSnapshotIsNewestFirstAndDoesNotConsumeEntries() {
        Stack<String> stack = new Stack<>();
        assertTrue(stack.isEmpty());
        assertNull(stack.pop());
        stack.push("one");
        stack.push("two");
        Array<String> snapshot = stack.snapshot();
        assertEquals("two", snapshot.get(0));
        assertEquals("one", snapshot.get(1));
        assertEquals(2, stack.size());
        assertFalse(stack.isEmpty());
        assertEquals("two", stack.pop());
        assertEquals("one", stack.peek());
        assertThrows(IllegalArgumentException.class, () -> stack.push(null));
        stack.clear();
        assertTrue(stack.isEmpty());
        assertNull(stack.peek());
    }

}
