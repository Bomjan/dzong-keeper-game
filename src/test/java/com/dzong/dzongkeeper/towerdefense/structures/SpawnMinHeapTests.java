package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.*;
import org.junit.jupiter.api.Test;
import java.util.Random;
import java.util.PriorityQueue;
import static org.junit.jupiter.api.Assertions.*;

class SpawnMinHeapTests {
    @Test void heapMatchesReferenceAcrossMixedOperationsAndTies() {
        SpawnMinHeap heap=new SpawnMinHeap();
        PriorityQueue<SpawnEvent> reference=new PriorityQueue<>();
        Random random=new Random(12);
        assertNull(heap.peek()); assertNull(heap.poll());
        for (int i=0;i<2000;i++) {
            if (!reference.isEmpty() && random.nextBoolean()) assertEquals(reference.poll(),heap.poll());
            else {
                SpawnEvent event=new SpawnEvent(random.nextInt(30),i,new GamePath(24),24,1,12);
                heap.add(event); reference.add(event);
            }
            assertEquals(reference.peek(),heap.peek()); assertEquals(reference.size(),heap.size());
        }
        while (!reference.isEmpty()) assertEquals(reference.poll(),heap.poll());
        assertNull(heap.poll());
    }
}
