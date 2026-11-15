package com.dzong.dzongkeeper.towerdefense.structures;

/** A resizable FIFO queue with amortized O(1) enqueue and O(1) dequeue. */
public final class CircularQueue<T> {
    private Object[] entries = new Object[4];
    private int head;
    private int size;

    public int size() {
        return size;
    }

    public void add(T value) {
        if (value == null) {
            throw new IllegalArgumentException("Missing queue value");
        }
        if (size == entries.length) {
            resize(entries.length * 2);
        }
        entries[(head + size) % entries.length] = value;
        size++;
    }

    @SuppressWarnings("unchecked")
    public T peek() {
        return size == 0 ? null : (T) entries[head];
    }

    @SuppressWarnings("unchecked")
    public T poll() {
        if (size == 0) {
            return null;
        }
        T value = (T) entries[head];
        entries[head] = null;
        head = (head + 1) % entries.length;
        size--;
        if (entries.length > 4 && size <= entries.length / 4) {
            resize(entries.length / 2);
        }
        return value;
    }

    private void resize(int capacity) {
        Object[] resized = new Object[capacity];
        for (int i = 0; i < size; i++) {
            resized[i] = entries[(head + i) % entries.length];
        }
        entries = resized;
        head = 0;
    }
}
