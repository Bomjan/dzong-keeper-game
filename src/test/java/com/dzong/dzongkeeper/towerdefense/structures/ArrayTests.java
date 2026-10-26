package com.dzong.dzongkeeper.towerdefense.structures;

import java.util.ArrayList;
import java.util.Random;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ArrayTests {
    @Test
    void constructorCopiesElementsAndTracksSize() {
        Integer[] source = {10, 20};
        Array<Integer> array = new Array<>(3, source);
        source[0] = 99;
        assertContents(array, 10, 20);
        array.add(30);
        assertContents(array, 10, 20, 30);
    }

    @Test
    void validatesInitialCapacity() {
        assertThrows(IllegalArgumentException.class, () -> new Array<>(-1));
        assertThrows(IllegalArgumentException.class, () -> new Array<>(1, new Integer[]{1, 2}));
        Array<Integer> array = new Array<>(0, new Integer[0]);
        array.add(1);
        assertContents(array, 1);
    }

    @Test
    void canReuseEmptyArrayAfterDeletingLastElement() {
        Array<Integer> array = new Array<>(0);
        for (int i = 0; i < 20; i++) {
            array.add(i);
            assertContents(array, i);
            array.delete();
            assertEquals(0, array.size());
        }
        array.add(42);
        assertContents(array, 42);
    }

    @Test
    void insertsAndDeletesAtBeginningMiddleAndEnd() {
        Array<Integer> array = new Array<>(8);
        array.add(2);
        array.add(0, 1);
        array.add(2, 4);
        array.add(2, 3);
        assertContents(array, 1, 2, 3, 4);
        array.delete(0);
        array.delete(1);
        array.delete();
        assertContents(array, 2);
        array.add(null);
        array.set(0, 5);
        assertContents(array, 5, null);
    }

    @Test
    void rejectsInvalidIndicesWithoutChangingContents() {
        Array<Integer> array = new Array<>();
        assertThrows(IndexOutOfBoundsException.class, array::delete);
        assertThrows(IndexOutOfBoundsException.class, () -> array.get(0));
        assertThrows(IndexOutOfBoundsException.class, () -> array.set(0, 1));
        array.add(10);
        for (int index : new int[]{-1, 1, 100}) {
            assertThrows(IndexOutOfBoundsException.class, () -> array.get(index));
            assertThrows(IndexOutOfBoundsException.class, () -> array.set(index, 20));
            assertThrows(IndexOutOfBoundsException.class, () -> array.delete(index));
        }
        for (int index : new int[]{-1, 2, 100}) {
            assertThrows(IndexOutOfBoundsException.class, () -> array.add(index, 20));
        }
        assertContents(array, 10);
    }

    @Test
    void preservesOrderAcrossGrowthShrinkAndMixedOperations() {
        Array<Integer> array = new Array<>();
        ArrayList<Integer> expected = new ArrayList<>();
        Random random = new Random(42);
        for (int round = 0; round < 5; round++) {
            for (int i = 0; i < 100; i++) {
                int index = random.nextInt(expected.size() + 1);
                array.add(index, i);
                expected.add(index, i);
                assertMatches(array, expected);
            }
            while (!expected.isEmpty()) {
                int index = random.nextInt(expected.size());
                array.set(index, -1);
                expected.set(index, -1);
                assertMatches(array, expected);
                array.delete(index);
                expected.remove(index);
                assertMatches(array, expected);
            }
        }
    }

    private static void assertMatches(Array<Integer> array, ArrayList<Integer> expected) {
        assertContents(array, expected.toArray(new Integer[0]));
    }

    private static void assertContents(Array<Integer> array, Integer... expected) {
        assertEquals(expected.length, array.size());
        for (int i = 0; i < expected.length; i++) {
            assertEquals(expected[i], array.get(i), "Element at index " + i);
        }
    }
}
