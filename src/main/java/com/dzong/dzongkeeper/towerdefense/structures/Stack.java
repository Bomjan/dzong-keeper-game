package com.dzong.dzongkeeper.towerdefense.structures;

/** A linked LIFO stack with O(1) push, peek, and pop. */
public final class Stack<T> {
    private static final class Node<T> {
        final T value;
        final Node<T> next;

        Node(T value, Node<T> next) {
            this.value = value;
            this.next = next;
        }
    }

    private Node<T> top;
    private int size;

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void push(T value) {
        if (value == null) {
            throw new IllegalArgumentException("Missing stack value");
        }
        top = new Node<>(value, top);
        size++;
    }

    public T peek() {
        return top == null ? null : top.value;
    }

    public T pop() {
        if (top == null) {
            return null;
        }
        T value = top.value;
        top = top.next;
        size--;
        return value;
    }

    /** Drops all entries in O(1). */
    public void clear() {
        top = null;
        size = 0;
    }

    /** Returns newest entries first without changing the stack. */
    public Array<T> snapshot() {
        Array<T> values = new Array<>();
        for (Node<T> node = top; node != null; node = node.next) {
            values.add(node.value);
        }
        return values;
    }
}
