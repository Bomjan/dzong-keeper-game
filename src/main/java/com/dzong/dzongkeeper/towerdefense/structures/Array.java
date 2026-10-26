package com.dzong.dzongkeeper.towerdefense.structures;

/**
 * A resizable, ordered array that accepts null elements.
 *
 * <p>Indices are zero-based. Insertion shifts later elements to the right;
 * deletion shifts them to the left. Appending and deleting the last element
 * also allow this structure to be used as a stack.
 *
 * <p>Capacity doubles when full and halves after deletion when at most a
 * quarter full, but never falls below one. Indexed access and replacement
 * take O(1) time; append and deletion of the last element take amortized O(1)
 * time. Insertion and deletion at arbitrary indices take O(n) time.
 *
 * @param <T> the element type
 */
public class Array<T> {
    private int n; // Index of the last occupied slot; -1 means empty.
    private T[] s;

    /**
     * Copies the initial elements into independent storage.
     *
     * @param capacity requested initial capacity; zero is normalized to one
     * @param arr initial elements, or null for an empty array
     * @throws IllegalArgumentException if capacity is negative or smaller than arr.length
     */
    @SuppressWarnings("unchecked")
    public Array(int capacity, T[] arr) {
        if (capacity < 0 || (arr != null && arr.length > capacity)) {
            throw new IllegalArgumentException("Capacity must be nonnegative and fit the initial elements");
        }
        n = arr == null ? -1 : arr.length - 1;
        s = (T[]) new Object[Math.max(1, capacity)];
        if (arr != null) {
            System.arraycopy(arr, 0, s, 0, arr.length);
        }
    }

    /** Creates an empty array with the requested capacity; zero becomes one. */
    public Array(int capacity) {
        this(capacity, null);
    }

    /** Creates an empty array with capacity one. */
    public Array() {
        this(1);
    }

    /** Returns the number of stored elements, excluding unused capacity. */
    public int size() {
        return n + 1;
    }

    /**
     * Returns the element at index.
     * @throws IndexOutOfBoundsException unless 0 <= index < size()
     */
    public T get(int index) {
        checkElementIndex(index);
        return s[index];
    }

    @SuppressWarnings("unchecked")
    private void resize(int capacity) {
        T[] newArray = (T[]) new Object[capacity];
        System.arraycopy(s, 0, newArray, 0, size());
        s = newArray;
    }

    /**
     * Inserts an element at index, shifting existing elements to the right.
     * Passing size() appends the element.
     * @throws IndexOutOfBoundsException unless 0 <= index <= size()
     */
    public void add(int index, T value) {
        if (index < 0 || index > size()) {
            throw new IndexOutOfBoundsException("Index: " + index + ", size: " + size());
        }
        if (size() == s.length) {
            resize(Math.multiplyExact(s.length, 2));
        }
        System.arraycopy(s, index, s, index + 1, size() - index);
        s[index] = value;
        n++;
    }

    /** Appends an element to the end. */
    public void add(T value) {
        add(size(), value);
    }

    /**
     * Deletes the element at index, shifting later elements to the left.
     * @throws IndexOutOfBoundsException unless 0 <= index < size()
     */
    public void delete(int index) {
        checkElementIndex(index);
        System.arraycopy(s, index + 1, s, index, n - index);
        s[n--] = null;
        if (s.length > 1 && size() <= s.length / 4) {
            resize(Math.max(1, s.length / 2));
        }
    }

    /**
     * Deletes the last element.
     * @throws IndexOutOfBoundsException if empty
     */
    public void delete() {
        delete(n);
    }

    /**
     * Replaces an existing element without changing the size.
     * Use add(value) to append instead.
     * @throws IndexOutOfBoundsException unless 0 <= index < size()
     */
    public void set(int index, T value) {
        checkElementIndex(index);
        s[index] = value;
    }

    private void checkElementIndex(int index) {
        if (index < 0 || index > n) {
            throw new IndexOutOfBoundsException("Index: " + index + ", size: " + size());
        }
    }
}
